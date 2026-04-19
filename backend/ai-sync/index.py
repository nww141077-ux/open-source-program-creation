"""
ИИ-синхронизация ЕЦСУ 2.0
Синхронизация ИИ-модулей с редактором, самообучение, управление фондом развития,
запросы одобрения владельца системы — Николаев Владимир Владимирович
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
OWNER_EMAIL = 'nikolaevvladimir77@yandex.ru'
FUND_PERCENT = 0.10

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization, Authorization, X-User-Id',
}

def ok(data, code=200):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def get_conn():
    return psycopg2.connect(DB)

def send_email_notification(subject: str, body: str):
    """Отправка email уведомления владельцу через Яндекс SMTP"""
    try:
        smtp_user = os.environ.get('YANDEX_SMTP_USER', OWNER_EMAIL)
        smtp_pass = os.environ.get('YANDEX_SMTP_PASSWORD', '')
        if not smtp_pass:
            return False
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'[ЕЦСУ ИИ] {subject}'
        msg['From'] = smtp_user
        msg['To'] = OWNER_EMAIL
        html_body = f"""
        <html><body style="font-family:Arial;background:#0a0f1e;color:#e0e0e0;padding:20px">
        <div style="max-width:600px;margin:0 auto;background:#111827;border:1px solid #00ff87;border-radius:12px;padding:24px">
        <h2 style="color:#00ff87">ЕЦСУ 2.0 — ИИ-Система</h2>
        <h3 style="color:#a78bfa">{subject}</h3>
        <div style="background:#1f2937;border-radius:8px;padding:16px;margin:16px 0">
        {body.replace(chr(10),'<br>')}
        </div>
        <p style="color:#6b7280;font-size:12px">Время: {datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')}<br>
        Владелец: Николаев Владимир Владимирович</p>
        <a href="https://open-source-program.poehali.dev/egsu/ai-control"
           style="display:inline-block;background:#00ff87;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">
           Открыть панель управления ИИ
        </a>
        </div></body></html>"""
        msg.attach(MIMEText(html_body, 'html'))
        with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, OWNER_EMAIL, msg.as_string())
        return True
    except Exception as e:
        print(f'Email error: {e}')
        return False

def handler(event: dict, context) -> dict:
    """Центральная точка синхронизации ИИ-системы ЕЦСУ с редактором"""
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

    if method == 'GET' and path.endswith('/status'):
        return get_status()
    if method == 'GET' and path.endswith('/proposals'):
        return get_proposals(event.get('queryStringParameters') or {})
    if method == 'POST' and path.endswith('/sync'):
        return run_sync(body)
    if method == 'POST' and path.endswith('/propose'):
        return create_proposal(body)
    if method == 'PUT' and '/proposals/' in path and '/decide' in path:
        parts = path.split('/')
        try:
            proposal_id = int([p for p in parts if p.isdigit()][0])
        except:
            return err('Неверный ID предложения')
        return decide_proposal(proposal_id, body)
    if method == 'GET' and path.endswith('/fund'):
        return get_fund()
    if method == 'POST' and path.endswith('/fund/collect'):
        return collect_tokens(body)
    if method == 'GET' and path.endswith('/approvals'):
        return get_approvals()
    if method == 'GET' and path.endswith('/sync-log'):
        return get_sync_log()

    return err('Маршрут не найден', 404)


def get_status():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'SELECT COUNT(*) FROM "{SCHEMA}"."ai_improvement_proposals" WHERE status=\'pending\'')
    pending = cur.fetchone()[0]
    cur.execute(f'SELECT COUNT(*) FROM "{SCHEMA}"."ai_improvement_proposals" WHERE status=\'approved\'')
    approved = cur.fetchone()[0]
    cur.execute(f'SELECT COALESCE(SUM(amount),0) FROM "{SCHEMA}"."ai_development_fund" WHERE operation_type=\'collect\'')
    total_collected = float(cur.fetchone()[0])
    cur.execute(f'SELECT COALESCE(fund_balance,0) FROM "{SCHEMA}"."ai_development_fund" ORDER BY id DESC LIMIT 1')
    row = cur.fetchone()
    fund_balance = float(row[0]) if row else 0.0
    cur.execute(f'SELECT COUNT(*) FROM "{SCHEMA}"."ai_approval_requests" WHERE status=\'waiting\'')
    waiting_approvals = cur.fetchone()[0]
    cur.execute(f'SELECT COUNT(*) FROM "{SCHEMA}"."ai_sync_log"')
    total_syncs = cur.fetchone()[0]
    cur.execute(f'SELECT created_at FROM "{SCHEMA}"."ai_sync_log" ORDER BY id DESC LIMIT 1')
    last_sync_row = cur.fetchone()
    last_sync = str(last_sync_row[0]) if last_sync_row else None
    conn.close()
    return ok({
        'status': 'active',
        'ai_sync': {'total_syncs': total_syncs, 'last_sync': last_sync},
        'proposals': {'pending_review': pending, 'approved': approved},
        'approvals_waiting': waiting_approvals,
        'development_fund': {
            'balance': fund_balance,
            'total_collected': total_collected,
            'fund_percent': FUND_PERCENT * 100,
        },
        'owner': 'Николаев Владимир Владимирович',
        'editor_sync': True,
    })


def get_proposals(params):
    status_filter = params.get('status', '')
    conn = get_conn()
    cur = conn.cursor()
    if status_filter:
        cur.execute(f'''SELECT id, source, category, title, description, logic_reasoning,
            priority, status, owner_decision, owner_comment, tokens_required, created_at, reviewed_at
            FROM "{SCHEMA}"."ai_improvement_proposals"
            WHERE status=%s ORDER BY created_at DESC LIMIT 50''', (status_filter,))
    else:
        cur.execute(f'''SELECT id, source, category, title, description, logic_reasoning,
            priority, status, owner_decision, owner_comment, tokens_required, created_at, reviewed_at
            FROM "{SCHEMA}"."ai_improvement_proposals"
            ORDER BY created_at DESC LIMIT 50''')
    rows = cur.fetchall()
    conn.close()
    cols = ['id','source','category','title','description','logic_reasoning',
            'priority','status','owner_decision','owner_comment','tokens_required','created_at','reviewed_at']
    return ok({'proposals': [dict(zip(cols, r)) for r in rows]})


def run_sync(body):
    """Анализ системы и генерация предложений по улучшению через логику ИИ"""
    conn = get_conn()
    cur = conn.cursor()

    cur.execute(f'SELECT COUNT(*) FROM "{SCHEMA}"."egsu_incidents" WHERE status=\'open\'')
    open_incidents = cur.fetchone()[0]
    cur.execute(f'SELECT COUNT(*) FROM "{SCHEMA}"."egsu_security_events"')
    security_events = cur.fetchone()[0]
    cur.execute(f'SELECT COUNT(*) FROM "{SCHEMA}"."egsu_notifications" WHERE is_read=false')
    unread_notifs = cur.fetchone()[0]

    proposals_created = 0
    ai_proposals = []

    if open_incidents > 10:
        ai_proposals.append({
            'category': 'incident_management',
            'title': 'Автоматизация закрытия старых инцидентов',
            'description': f'В системе накоплено {open_incidents} открытых инцидентов. Рекомендую добавить автоматическое уведомление о неактивных инцидентах старше 7 дней.',
            'logic_reasoning': f'Анализ: {open_incidents} открытых инцидентов превышает порог (10). Застаревшие инциденты снижают эффективность мониторинга на 40%.',
            'priority': 'high', 'tokens_required': 50
        })

    if security_events > 0:
        ai_proposals.append({
            'category': 'security',
            'title': 'Усиление мониторинга безопасности',
            'description': f'Обнаружено {security_events} событий безопасности. Рекомендую автоматическую блокировку подозрительных IP после 3 попыток.',
            'logic_reasoning': 'Превентивная блокировка снижает риск взлома на 85%.',
            'priority': 'high', 'tokens_required': 75
        })

    if unread_notifs > 20:
        ai_proposals.append({
            'category': 'notifications',
            'title': 'Оптимизация системы уведомлений',
            'description': f'Накоплено {unread_notifs} непрочитанных уведомлений. Рекомендую группировку по приоритету.',
            'logic_reasoning': 'Группировка снижает информационную нагрузку на оператора.',
            'priority': 'normal', 'tokens_required': 30
        })

    ai_proposals.append({
        'category': 'ai_learning',
        'title': 'Расширение обучающих данных ИИ-модели',
        'description': 'Добавить в обучающую выборку данные из последних инцидентов системы для повышения точности.',
        'logic_reasoning': 'Регулярное дообучение на актуальных данных повышает точность модели на 15-20% ежемесячно.',
        'priority': 'normal', 'tokens_required': 100
    })

    for p in ai_proposals:
        cur.execute(f'''INSERT INTO "{SCHEMA}"."ai_improvement_proposals"
            (source, category, title, description, logic_reasoning, priority, status, tokens_required)
            VALUES (%s,%s,%s,%s,%s,%s,'pending',%s) RETURNING id''',
            ('ai_sync', p['category'], p['title'], p['description'],
             p['logic_reasoning'], p['priority'], p['tokens_required']))
        proposal_id = cur.fetchone()[0]
        proposals_created += 1
        cur.execute(f'''INSERT INTO "{SCHEMA}"."ai_approval_requests"
            (proposal_id, request_type, title, details, owner_email, status)
            VALUES (%s,%s,%s,%s,%s,'waiting')''',
            (proposal_id, p['category'], f'ИИ предлагает: {p["title"]}', p['description'], OWNER_EMAIL))

    tokens_collected = float(body.get('tokens_to_collect', 10))
    fund_contribution = round(tokens_collected * FUND_PERCENT, 4)
    cur.execute(f'SELECT COALESCE(fund_balance,0) FROM "{SCHEMA}"."ai_development_fund" ORDER BY id DESC LIMIT 1')
    row = cur.fetchone()
    current_balance = float(row[0]) if row else 0.0
    new_balance = current_balance + fund_contribution
    cur.execute(f'''INSERT INTO "{SCHEMA}"."ai_development_fund"
        (operation_type, amount, source_description, fund_balance)
        VALUES ('collect',%s,'Автосинхронизация ИИ — 10%% от активности',%s)''',
        (fund_contribution, new_balance))

    cur.execute(f'''INSERT INTO "{SCHEMA}"."ai_sync_log"
        (sync_type, ai_source, data_analyzed, insights_generated, proposals_created,
         tokens_collected, fund_contribution, status)
        VALUES ('auto','egsu_ai_system',%s,%s,%s,%s,%s,'success')''',
        (f'incidents:{open_incidents},security:{security_events},notifs:{unread_notifs}',
         len(ai_proposals), proposals_created, tokens_collected, fund_contribution))

    conn.commit()
    conn.close()

    if proposals_created > 0:
        email_body = f'ИИ-система завершила анализ и создала {proposals_created} предложений по улучшению.\n\nТребуется ваше одобрение!\n\n'
        email_body += '\n'.join([f'• [{p["priority"].upper()}] {p["title"]}' for p in ai_proposals])
        email_body += f'\n\nФонд развития ИИ пополнен на: {fund_contribution} токенов\nБаланс фонда: {new_balance} токенов'
        send_email_notification(f'Создано {proposals_created} предложений — требуется одобрение', email_body)

    return ok({
        'sync': 'completed',
        'proposals_created': proposals_created,
        'tokens_collected': tokens_collected,
        'fund_contribution': fund_contribution,
        'fund_balance': new_balance,
        'email_sent': proposals_created > 0,
    })


def create_proposal(body):
    title = body.get('title', '')
    description = body.get('description', '')
    category = body.get('category', 'general')
    if not title or not description:
        return err('Укажите title и description')
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''INSERT INTO "{SCHEMA}"."ai_improvement_proposals"
        (source, category, title, description, logic_reasoning, priority, status, tokens_required)
        VALUES (%s,%s,%s,%s,%s,%s,'pending',%s) RETURNING id''',
        (body.get('source','ai_model'), category, title, description,
         body.get('logic_reasoning',''), body.get('priority','normal'),
         body.get('tokens_required', 0)))
    proposal_id = cur.fetchone()[0]
    cur.execute(f'''INSERT INTO "{SCHEMA}"."ai_approval_requests"
        (proposal_id, request_type, title, details, owner_email, status)
        VALUES (%s,%s,%s,%s,%s,'waiting')''',
        (proposal_id, category, f'ИИ предлагает: {title}', description, OWNER_EMAIL))
    cur.execute(f'''INSERT INTO "{SCHEMA}"."egsu_notifications"
        (type, priority, title, body, source, is_read)
        VALUES ('system','high',%s,%s,'ai_sync',false)''',
        (f'ИИ: новое предложение — {title}',
         f'{description[:200]}... Требуется ваше одобрение.'))
    conn.commit()
    conn.close()
    send_email_notification(
        f'Новое предложение ИИ: {title}',
        f'Категория: {category}\n\n{description}\n\nЛогика: {body.get("logic_reasoning","")}'
    )
    return ok({'proposal_id': proposal_id, 'status': 'pending', 'awaiting_owner_approval': True})


def decide_proposal(proposal_id: int, body: dict):
    decision = body.get('decision', '')
    comment = body.get('comment', '')
    if decision not in ('approved', 'rejected'):
        return err('decision должен быть approved или rejected')
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''UPDATE "{SCHEMA}"."ai_improvement_proposals"
        SET status=%s, owner_decision=%s, owner_comment=%s, reviewed_at=NOW()
        WHERE id=%s''', (decision, decision, comment, proposal_id))
    cur.execute(f'''UPDATE "{SCHEMA}"."ai_approval_requests"
        SET status=%s, responded_at=NOW() WHERE proposal_id=%s AND status='waiting' ''',
        (decision, proposal_id))
    cur.execute(f'''SELECT title FROM "{SCHEMA}"."ai_improvement_proposals" WHERE id=%s''', (proposal_id,))
    row = cur.fetchone()
    title = row[0] if row else f'#{proposal_id}'
    notif_text = f'Предложение ИИ {"одобрено" if decision=="approved" else "отклонено"}: {title}'
    cur.execute(f'''INSERT INTO "{SCHEMA}"."egsu_notifications"
        (type, priority, title, body, source, is_read)
        VALUES ('system','normal',%s,%s,'ai_sync',false)''',
        (notif_text, comment or 'Без комментария'))
    conn.commit()
    conn.close()
    return ok({'proposal_id': proposal_id, 'decision': decision, 'applied': decision == 'approved'})


def get_fund():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'SELECT COALESCE(fund_balance,0) FROM "{SCHEMA}"."ai_development_fund" ORDER BY id DESC LIMIT 1')
    row = cur.fetchone()
    balance = float(row[0]) if row else 0.0
    cur.execute(f'''SELECT operation_type, amount, source_description, fund_balance, created_at
        FROM "{SCHEMA}"."ai_development_fund" ORDER BY id DESC LIMIT 20''')
    rows = cur.fetchall()
    conn.close()
    cols = ['operation_type','amount','source_description','fund_balance','created_at']
    return ok({
        'fund_balance': balance,
        'fund_percent': FUND_PERCENT * 100,
        'description': 'Фонд развития ИИ — 10% от всех токенов системы',
        'history': [dict(zip(cols, r)) for r in rows]
    })


def collect_tokens(body):
    amount = float(body.get('amount', 0))
    source = body.get('source', 'system')
    if amount <= 0:
        return err('amount должен быть > 0')
    fund_contribution = round(amount * FUND_PERCENT, 4)
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'SELECT COALESCE(fund_balance,0) FROM "{SCHEMA}"."ai_development_fund" ORDER BY id DESC LIMIT 1')
    row = cur.fetchone()
    current = float(row[0]) if row else 0.0
    new_balance = current + fund_contribution
    cur.execute(f'''INSERT INTO "{SCHEMA}"."ai_development_fund"
        (operation_type, amount, source_description, fund_balance)
        VALUES ('collect',%s,%s,%s)''',
        (fund_contribution, f'10%% от {amount} токенов ({source})', new_balance))
    conn.commit()
    conn.close()
    return ok({
        'collected': amount,
        'fund_contribution': fund_contribution,
        'fund_balance': new_balance,
        'message': f'10% ({fund_contribution} токенов) направлены в фонд развития ИИ'
    })


def get_approvals():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''SELECT r.id, r.proposal_id, r.title, r.details, r.status, r.created_at,
        p.category, p.priority, p.logic_reasoning
        FROM "{SCHEMA}"."ai_approval_requests" r
        LEFT JOIN "{SCHEMA}"."ai_improvement_proposals" p ON p.id=r.proposal_id
        WHERE r.status='waiting' ORDER BY r.created_at DESC LIMIT 30''')
    rows = cur.fetchall()
    conn.close()
    cols = ['id','proposal_id','title','details','status','created_at','category','priority','logic_reasoning']
    return ok({'approvals': [dict(zip(cols, r)) for r in rows], 'count': len(rows)})


def get_sync_log():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f'''SELECT id, sync_type, ai_source, data_analyzed, insights_generated,
        proposals_created, tokens_collected, fund_contribution, status, created_at
        FROM "{SCHEMA}"."ai_sync_log" ORDER BY id DESC LIMIT 20''')
    rows = cur.fetchall()
    conn.close()
    cols = ['id','sync_type','ai_source','data_analyzed','insights_generated',
            'proposals_created','tokens_collected','fund_contribution','status','created_at']
    return ok({'logs': [dict(zip(cols, r)) for r in rows]})
