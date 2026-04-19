"""
Завет ЕЦСУ 2.0 — директива высшего приоритета
Хранение, редактирование пунктов Завета и совместные решения владельца и ИИ-заместителя.
Доступ: только владелец системы + ИИ-заместитель.
"""
import json
import os
import psycopg2
from datetime import datetime, timezone

DB = os.environ.get('DATABASE_URL')
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p38294978_open_source_program_')

OWNER_TOKEN = "ecsu-ark-owner-2024"
AI_TOKEN = "ecsu-ai-deputy-2024"

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Token, X-AI-Token, Authorization',
}

def ok(data, code=200):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': msg}, ensure_ascii=False)}

def get_conn():
    return psycopg2.connect(DB)

def check_access(event: dict):
    """Проверка доступа — только владелец или ИИ-заместитель"""
    headers = event.get('headers') or {}
    owner_tok = headers.get('X-Owner-Token') or headers.get('x-owner-token', '')
    ai_tok = headers.get('X-AI-Token') or headers.get('x-ai-token', '')
    if owner_tok == OWNER_TOKEN:
        return 'owner'
    if ai_tok == AI_TOKEN:
        return 'ai'
    return None

def handler(event: dict, context) -> dict:
    """Управление Заветом системы — директивой высшего приоритета ЕЦСУ"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except:
            pass

    # GET / — получить весь Завет (публично для чтения)
    if method == 'GET' and (path.endswith('/') or path.endswith('/covenant')):
        return get_covenant()

    # GET /decisions — совместные решения
    if method == 'GET' and path.endswith('/decisions'):
        return get_decisions()

    # Все мутирующие операции требуют авторизации
    role = check_access(event)

    # GET /verify — проверка доступа
    if method == 'GET' and path.endswith('/verify'):
        if not role:
            return err('Доступ запрещён. Только владелец или ИИ-заместитель.', 403)
        return ok({'role': role, 'access': True,
                   'name': 'Николаев Владимир Владимирович' if role == 'owner' else 'ИИ-Заместитель ЕЦСУ'})

    if not role:
        return err('Доступ запрещён. Только владелец или ИИ-заместитель.', 403)

    # PUT /items/{id} — редактировать пункт Завета (только владелец)
    if method == 'PUT' and '/items/' in path:
        if role != 'owner':
            return err('Редактировать Завет может только Владелец.', 403)
        parts = path.split('/')
        try:
            item_id = int([p for p in parts if p.isdigit()][0])
        except:
            return err('Неверный ID пункта')
        return update_item(item_id, body)

    # POST /decisions — создать совместное решение
    if method == 'POST' and path.endswith('/decisions'):
        return create_decision(body, role)

    # PUT /decisions/{id}/vote — проголосовать
    if method == 'PUT' and '/decisions/' in path and '/vote' in path:
        parts = path.split('/')
        try:
            dec_id = int([p for p in parts if p.isdigit()][0])
        except:
            return err('Неверный ID решения')
        return vote_decision(dec_id, body, role)

    # PUT /decisions/{id}/resolve — финализировать решение (только владелец)
    if method == 'PUT' and '/decisions/' in path and '/resolve' in path:
        if role != 'owner':
            return err('Финализировать решение может только Владелец.', 403)
        parts = path.split('/')
        try:
            dec_id = int([p for p in parts if p.isdigit()][0])
        except:
            return err('Неверный ID решения')
        return resolve_decision(dec_id, body)

    return err('Маршрут не найден', 404)


def get_covenant():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''SELECT id, covenant_num, priority_num, icon, title, subtitle,
        color, description, sort_order, is_active, updated_at, updated_by
        FROM "{SCHEMA}"."ark_covenant" ORDER BY sort_order''')
    rows = cur.fetchall()
    conn.close()
    cols = ['id','covenant_num','priority_num','icon','title','subtitle',
            'color','description','sort_order','is_active','updated_at','updated_by']
    return ok({'covenant': [dict(zip(cols, r)) for r in rows]})


def update_item(item_id: int, body: dict):
    conn = get_conn()
    cur = conn.cursor()
    fields = []
    vals = []
    for key in ('title', 'subtitle', 'description', 'icon', 'color', 'priority_num'):
        if key in body:
            fields.append(f'{key}=%s')
            vals.append(body[key])
    if not fields:
        conn.close()
        return err('Нет полей для обновления')
    fields.append('updated_at=NOW()')
    fields.append("updated_by='owner'")
    vals.append(item_id)
    cur.execute(f'UPDATE "{SCHEMA}"."ark_covenant" SET {", ".join(fields)} WHERE id=%s', vals)
    conn.commit()
    conn.close()
    return ok({'updated': True, 'id': item_id})


def get_decisions():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''SELECT id, decision_title, decision_body, initiator, status,
        owner_vote, ai_vote, ai_reasoning, final_decision, created_at, resolved_at
        FROM "{SCHEMA}"."ark_covenant_decisions" ORDER BY created_at DESC LIMIT 30''')
    rows = cur.fetchall()
    conn.close()
    cols = ['id','decision_title','decision_body','initiator','status',
            'owner_vote','ai_vote','ai_reasoning','final_decision','created_at','resolved_at']
    return ok({'decisions': [dict(zip(cols, r)) for r in rows]})


def create_decision(body: dict, role: str):
    title = body.get('decision_title', '')
    text = body.get('decision_body', '')
    if not title:
        return err('Укажите заголовок решения')
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''INSERT INTO "{SCHEMA}"."ark_covenant_decisions"
        (decision_title, decision_body, initiator, status)
        VALUES (%s,%s,%s,'discussion') RETURNING id''',
        (title, text, role))
    new_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return ok({'id': new_id, 'status': 'discussion', 'initiator': role})


def vote_decision(dec_id: int, body: dict, role: str):
    vote = body.get('vote', '')
    reasoning = body.get('reasoning', '')
    if vote not in ('approve', 'reject', 'discuss'):
        return err('vote должен быть: approve / reject / discuss')
    conn = get_conn()
    cur = conn.cursor()
    if role == 'owner':
        cur.execute(f'UPDATE "{SCHEMA}"."ark_covenant_decisions" SET owner_vote=%s WHERE id=%s',
                    (vote, dec_id))
    else:
        cur.execute(f'UPDATE "{SCHEMA}"."ark_covenant_decisions" SET ai_vote=%s, ai_reasoning=%s WHERE id=%s',
                    (vote, reasoning, dec_id))
    # Автоматически финализируем если оба проголосовали одинаково
    cur.execute(f'SELECT owner_vote, ai_vote FROM "{SCHEMA}"."ark_covenant_decisions" WHERE id=%s', (dec_id,))
    row = cur.fetchone()
    if row and row[0] and row[1] and row[0] == row[1] and row[0] != 'discuss':
        final = 'approved' if row[0] == 'approve' else 'rejected'
        cur.execute(f'''UPDATE "{SCHEMA}"."ark_covenant_decisions"
            SET status=%s, final_decision=%s, resolved_at=NOW() WHERE id=%s''',
            (final, final, dec_id))
    conn.commit()
    conn.close()
    return ok({'voted': True, 'role': role, 'vote': vote})


def resolve_decision(dec_id: int, body: dict):
    final = body.get('final_decision', '')
    if final not in ('approved', 'rejected'):
        return err('final_decision: approved или rejected')
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''UPDATE "{SCHEMA}"."ark_covenant_decisions"
        SET status=%s, final_decision=%s, resolved_at=NOW() WHERE id=%s''',
        (final, final, dec_id))
    conn.commit()
    conn.close()
    return ok({'resolved': True, 'final_decision': final})
