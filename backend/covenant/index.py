"""
Завет ЕЦСУ 2.0 — директива высшего приоритета
Хранение, редактирование пунктов Завета и совместные решения владельца и ИИ-заместителя.
Доступ: только владелец системы + ИИ-заместитель.
"""
import json
import os
import psycopg2
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone

DB = os.environ.get('DATABASE_URL')
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p38294978_open_source_program_')

OWNER_TOKEN = "ecsu-ark-owner-2024"
AI_TOKEN = "ecsu-ai-deputy-2024"
OWNER_EMAIL = "nikolaevvladimir77@yandex.ru"

def send_email(subject: str, body_html: str):
    try:
        smtp_user = os.environ.get('YANDEX_SMTP_USER', OWNER_EMAIL)
        smtp_pass = os.environ.get('YANDEX_SMTP_PASSWORD', '')
        if not smtp_pass:
            return False
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'[ЕЦСУ · Завет] {subject}'
        msg['From'] = smtp_user
        msg['To'] = OWNER_EMAIL
        full_html = f"""<html><body style="font-family:Arial;background:#060a12;color:#e0e0e0;padding:20px">
        <div style="max-width:600px;margin:0 auto;background:#111827;border:1px solid #00ff87;border-radius:12px;padding:24px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="background:linear-gradient(135deg,#00ff87,#3b82f6);border-radius:8px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px">📜</div>
          <div>
            <div style="color:#00ff87;font-weight:800;font-size:15px">ЕЦСУ 2.0 — Завет системы</div>
            <div style="color:#4b5563;font-size:11px">Директива высшего приоритета</div>
          </div>
        </div>
        {body_html}
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #1f2937;font-size:11px;color:#374151">
          Владелец: Николаев Владимир Владимирович · ECSU 2.0<br>
          {datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')}
        </div>
        </div></body></html>"""
        msg.attach(MIMEText(full_html, 'html'))
        with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as s:
            s.login(smtp_user, smtp_pass)
            s.sendmail(smtp_user, OWNER_EMAIL, msg.as_string())
        return True
    except Exception as e:
        print(f'Email error: {e}')
        return False

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

    # Уведомление владельцу если решение предложил ИИ-заместитель
    if role == 'ai':
        initiator_label = 'ИИ-Заместитель ЕЦСУ'
        send_email(
            f'ИИ предлагает новое решение: {title}',
            f'''<div style="background:#0d1b2a;border-left:4px solid #a855f7;border-radius:8px;padding:16px;margin-bottom:16px">
            <div style="color:#a855f7;font-size:11px;font-weight:700;margin-bottom:6px">ИНИЦИАТОР: {initiator_label}</div>
            <div style="color:#fff;font-size:15px;font-weight:700;margin-bottom:8px">{title}</div>
            <div style="color:#9ca3af;font-size:13px;line-height:1.6">{text or "Без описания"}</div>
            </div>
            <div style="color:#6b7280;font-size:12px">Решение #{new_id} вынесено на совместное обсуждение.<br>
            Войдите в Ковчег → Завет → Совместные решения, чтобы проголосовать.</div>'''
        )

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
    # Получаем заголовок решения для уведомления
    cur.execute(f'SELECT owner_vote, ai_vote, decision_title FROM "{SCHEMA}"."ark_covenant_decisions" WHERE id=%s', (dec_id,))
    row = cur.fetchone()
    auto_resolved = False
    final = None
    if row and row[0] and row[1] and row[0] == row[1] and row[0] != 'discuss':
        final = 'approved' if row[0] == 'approve' else 'rejected'
        cur.execute(f'''UPDATE "{SCHEMA}"."ark_covenant_decisions"
            SET status=%s, final_decision=%s, resolved_at=NOW() WHERE id=%s''',
            (final, final, dec_id))
        auto_resolved = True
    conn.commit()
    conn.close()

    dec_title = row[2] if row else f'#{dec_id}'
    vote_label = {'approve': 'За', 'reject': 'Против', 'discuss': 'На обсуждение'}.get(vote, vote)
    role_label = 'Владелец' if role == 'owner' else 'ИИ-Заместитель'
    vote_color = '#00ff87' if vote == 'approve' else '#f43f5e' if vote == 'reject' else '#f59e0b'

    if role == 'ai':
        # ИИ проголосовал — уведомить владельца
        body_html = f'''<div style="background:#0d1b2a;border-left:4px solid #a855f7;border-radius:8px;padding:16px;margin-bottom:12px">
            <div style="color:#a855f7;font-size:11px;font-weight:700;margin-bottom:4px">ИИ-ЗАМЕСТИТЕЛЬ ПРОГОЛОСОВАЛ</div>
            <div style="color:#fff;font-size:14px;font-weight:700;margin-bottom:6px">{dec_title}</div>
            <div style="color:{vote_color};font-size:16px;font-weight:800">{vote_label}</div>
            {f'<div style="color:#9ca3af;font-size:12px;margin-top:6px">{reasoning}</div>' if reasoning else ''}
            </div>'''
        if auto_resolved:
            body_html += f'<div style="background:rgba(0,255,135,0.08);border:1px solid rgba(0,255,135,0.2);border-radius:8px;padding:12px;color:#00ff87;font-weight:700">Решение автоматически {"принято" if final == "approved" else "отклонено"} — голоса совпали.</div>'
        else:
            body_html += '<div style="color:#6b7280;font-size:12px">Откройте Ковчег → Завет → Совместные решения, чтобы проголосовать.</div>'
        send_email(f'ИИ проголосовал "{vote_label}" по решению: {dec_title}', body_html)

    return ok({'voted': True, 'role': role, 'vote': vote, 'auto_resolved': auto_resolved})


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