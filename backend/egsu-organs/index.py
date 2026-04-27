"""
API органов ECSU — список органов, обращения граждан, лента инцидентов для органов,
распоряжения владельца, пресс-релизы и публикация в открытые каналы.

GET  /                        — список органов
POST /appeal                  — обращение гражданина
GET  /appeal?ticket_id=X      — статус обращения
GET  /incidents               — лента инцидентов для органов (+ предполагаемые)
GET  /incidents?organ=CODE    — инциденты по органу
GET  /orders?incident_id=X    — распоряжения владельца по инциденту
POST /orders                  — создать распоряжение
GET  /notifications?organ=X   — уведомления органу
POST /notifications/read      — отметить прочитанными
GET  /actions?incident_id=X   — действия реагирования органов
GET  /press                   — пресс-релизы
POST /press                   — создать пресс-релиз из инцидента
POST /press/publish           — опубликовать пресс-релиз в открытые каналы
"""
import json
import os
import time
import psycopg2
from psycopg2.extras import RealDictCursor

S = "t_p38294978_open_source_program_"
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
}

CHANNELS = ["Официальный сайт EGSU", "Telegram-канал EGSU", "Пресс-служба EGSU", "Международные СМИ"]


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def esc(value) -> str:
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def esc_bool(value) -> str:
    return 'TRUE' if value else 'FALSE'


def gen_ticket_id(organ_code: str) -> str:
    short = (organ_code or 'GEN').upper().replace('-', '')[:6]
    ts_last6 = str(int(time.time()))[-6:]
    return f'ECSU-{short}-{ts_last6}'


def ok(data, code=200):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps(data, default=str, ensure_ascii=False)}


def err(msg, code=400):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def rows_to_list(cur):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def handler(event: dict, context) -> dict:
    """Обработчик API органов EGSU: органы, обращения граждан, инциденты, распоряжения, пресса."""
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    params = event.get('queryStringParameters') or {}

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    p = path.rstrip('/')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    conn = get_db()
    cur = conn.cursor()

    # ── GET / — список органов ───────────────────────────────────────────────
    if method == 'GET' and not any(x in p for x in ['/appeal', '/incidents', '/orders', '/notifications', '/actions', '/press']):
        cur.execute(f"SELECT * FROM {S}.egsu_organs WHERE is_active = TRUE ORDER BY sort_order ASC")
        organs = rows_to_list(cur)
        # Добавим счётчик непрочитанных уведомлений для каждого органа
        cur.execute(f"SELECT organ_code, COUNT(*) as unread FROM {S}.egsu_organ_notifications WHERE is_read=FALSE GROUP BY organ_code")
        unread_map = {r[0]: r[1] for r in cur.fetchall()}
        for o in organs:
            o['unread_count'] = unread_map.get(o.get('code') or o.get('organ_code', ''), 0)
        conn.close()
        return ok({'organs': organs, 'total': len(organs)})

    # ── GET /appeal — статус обращения ───────────────────────────────────────
    if method == 'GET' and '/appeal' in p:
        ticket_id = params.get('ticket_id', '').strip()
        if not ticket_id:
            conn.close()
            return err('Параметр ticket_id обязателен')
        cur.execute(f"SELECT * FROM {S}.egsu_citizen_appeals WHERE ticket_id = {esc(ticket_id)} LIMIT 1")
        row = rows_to_list(cur)
        conn.close()
        if not row:
            return err('Обращение не найдено', 404)
        return ok({'appeal': row[0]})

    # ── POST /appeal — создать обращение ─────────────────────────────────────
    if method == 'POST' and '/appeal' in p:
        organ_code = (body.get('organ_code') or '').strip()
        subject = (body.get('subject') or '').strip()
        description = (body.get('description') or '').strip()
        if not organ_code or not subject or not description:
            conn.close()
            return err('organ_code, subject, description обязательны', 422)
        category = (body.get('category') or '').strip() or None
        location = (body.get('location') or '').strip() or None
        evidence_desc = (body.get('evidence_desc') or '').strip() or None
        contact_email = (body.get('contact_email') or '').strip() or None
        contact_phone = (body.get('contact_phone') or '').strip() or None
        is_anonymous = bool(body.get('is_anonymous', False))
        ticket_id = gen_ticket_id(organ_code)
        cur.execute(
            f"INSERT INTO {S}.egsu_citizen_appeals "
            f"(ticket_id, organ_code, category, subject, description, location, evidence_desc, "
            f"contact_email, contact_phone, is_anonymous, status) "
            f"VALUES ({esc(ticket_id)},{esc(organ_code)},{esc(category)},{esc(subject)},"
            f"{esc(description)},{esc(location)},{esc(evidence_desc)},"
            f"{esc(contact_email)},{esc(contact_phone)},{esc_bool(is_anonymous)},'new') "
            f"RETURNING ticket_id, created_at"
        )
        result = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({'success': True, 'ticket_id': result[0], 'created_at': str(result[1]),
                   'message': 'Обращение зарегистрировано в системе EGSU'}, 201)

    # ── GET /incidents — лента инцидентов для органов ────────────────────────
    if method == 'GET' and '/incidents' in p:
        organ = params.get('organ', '')
        limit = min(int(params.get('limit', 50)), 200)
        inc_type = params.get('type', '')  # 'suspected' — только предполагаемые
        where = []
        if organ:
            where.append(f"responsible_organ ILIKE {esc('%' + organ + '%')}")
        if inc_type == 'suspected':
            where.append("status IN ('new','pending_verification')")
        elif inc_type == 'verified':
            where.append("status = 'verified'")
        where_sql = ('WHERE ' + ' AND '.join(where)) if where else ''
        cur.execute(f"""
            SELECT i.id, i.incident_code, i.type, i.title, i.description,
                   i.country, i.location, i.severity, i.status,
                   i.verification_score, i.responsible_organ,
                   i.ai_confidence, i.created_at, i.updated_at,
                   i.has_photo, i.has_video, i.has_witnesses,
                   i.mgp_distinction, i.mgp_proportionality, i.mgp_necessity,
                   (SELECT COUNT(*) FROM {S}.egsu_incident_actions a WHERE a.incident_id = i.id) as actions_count,
                   (SELECT COUNT(*) FROM {S}.egsu_owner_orders o WHERE o.incident_id = i.id) as orders_count
            FROM {S}.egsu_incidents i
            {where_sql}
            ORDER BY i.created_at DESC LIMIT {limit}
        """)
        incidents = rows_to_list(cur)
        conn.close()
        return ok({'incidents': incidents, 'total': len(incidents)})

    # ── GET /orders — распоряжения владельца ─────────────────────────────────
    if method == 'GET' and '/orders' in p and '/press' not in p:
        inc_id = params.get('incident_id')
        where = f"WHERE incident_id = {int(inc_id)}" if inc_id else ""
        cur.execute(f"""
            SELECT o.*, i.title as incident_title, i.incident_code as inc_code
            FROM {S}.egsu_owner_orders o
            LEFT JOIN {S}.egsu_incidents i ON i.id = o.incident_id
            {where}
            ORDER BY o.created_at DESC LIMIT 100
        """)
        orders = rows_to_list(cur)
        conn.close()
        return ok({'orders': orders, 'total': len(orders)})

    # ── POST /orders — создать распоряжение ──────────────────────────────────
    if method == 'POST' and '/orders' in p and '/press' not in p:
        inc_id = body.get('incident_id')
        order_text = (body.get('order_text') or '').strip()
        if not order_text:
            conn.close()
            return err('order_text обязателен')
        target_organ = (body.get('target_organ') or '').strip() or None
        priority = body.get('priority', 'normal')
        inc_code = None
        if inc_id:
            cur.execute(f"SELECT incident_code FROM {S}.egsu_incidents WHERE id = {int(inc_id)}")
            row = cur.fetchone()
            if row:
                inc_code = row[0]
        cur.execute(
            f"INSERT INTO {S}.egsu_owner_orders (incident_id, incident_code, order_text, target_organ, priority) "
            f"VALUES ({esc(inc_id)},{esc(inc_code)},{esc(order_text)},{esc(target_organ)},{esc(priority)}) "
            f"RETURNING id, created_at"
        )
        result = cur.fetchone()
        # Создаём уведомление органу
        if target_organ:
            cur.execute(
                f"INSERT INTO {S}.egsu_organ_notifications "
                f"(organ_code, incident_id, incident_code, notification_type, title, body, severity) "
                f"VALUES ({esc(target_organ)},{esc(inc_id)},{esc(inc_code)},'order',"
                f"{esc('Распоряжение владельца: ' + order_text[:100])},"
                f"{esc(order_text)},{esc(priority)})"
            )
        conn.commit()
        conn.close()
        return ok({'id': result[0], 'created_at': str(result[1]), 'message': 'Распоряжение выдано'}, 201)

    # ── GET /notifications — уведомления органу ──────────────────────────────
    if method == 'GET' and '/notifications' in p:
        organ = params.get('organ', '')
        limit = min(int(params.get('limit', 50)), 200)
        where = f"WHERE organ_code = {esc(organ)}" if organ else ""
        cur.execute(f"""
            SELECT n.*, i.title as incident_title, i.severity as incident_severity,
                   i.status as incident_status
            FROM {S}.egsu_organ_notifications n
            LEFT JOIN {S}.egsu_incidents i ON i.id = n.incident_id
            {where}
            ORDER BY n.created_at DESC LIMIT {limit}
        """)
        notifs = rows_to_list(cur)
        conn.close()
        return ok({'notifications': notifs, 'total': len(notifs)})

    # ── POST /notifications/read — отметить прочитанными ─────────────────────
    if method == 'POST' and '/notifications' in p and '/read' in p:
        organ = body.get('organ_code', '')
        ids = body.get('ids', [])
        if organ:
            cur.execute(f"UPDATE {S}.egsu_organ_notifications SET is_read=TRUE WHERE organ_code={esc(organ)}")
        elif ids:
            ids_str = ','.join(str(int(i)) for i in ids)
            cur.execute(f"UPDATE {S}.egsu_organ_notifications SET is_read=TRUE WHERE id IN ({ids_str})")
        conn.commit()
        conn.close()
        return ok({'message': 'Отмечено прочитанным'})

    # ── GET /actions — действия реагирования ─────────────────────────────────
    if method == 'GET' and '/actions' in p:
        inc_id = params.get('incident_id')
        organ = params.get('organ', '')
        limit = min(int(params.get('limit', 100)), 500)
        where = []
        if inc_id:
            where.append(f"a.incident_id = {int(inc_id)}")
        if organ:
            where.append(f"i.responsible_organ ILIKE {esc('%' + organ + '%')}")
        where_sql = ('WHERE ' + ' AND '.join(where)) if where else ''
        cur.execute(f"""
            SELECT a.*, i.title as incident_title, i.incident_code,
                   i.type as incident_type, i.severity, i.responsible_organ
            FROM {S}.egsu_incident_actions a
            JOIN {S}.egsu_incidents i ON i.id = a.incident_id
            {where_sql}
            ORDER BY a.applied_at DESC LIMIT {limit}
        """)
        actions = rows_to_list(cur)
        conn.close()
        return ok({'actions': actions, 'total': len(actions)})

    # ── GET /press — список пресс-релизов ────────────────────────────────────
    if method == 'GET' and '/press' in p and 'publish' not in p:
        limit = min(int(params.get('limit', 50)), 200)
        status_filter = params.get('status', '')
        where = f"WHERE status = {esc(status_filter)}" if status_filter else ""
        cur.execute(f"""
            SELECT pr.*, i.title as incident_title, i.type as incident_type,
                   i.severity, i.country, i.status as incident_status
            FROM {S}.egsu_press_releases pr
            LEFT JOIN {S}.egsu_incidents i ON i.id = pr.incident_id
            {where}
            ORDER BY pr.created_at DESC LIMIT {limit}
        """)
        releases = rows_to_list(cur)
        conn.close()
        return ok({'releases': releases, 'total': len(releases), 'channels': CHANNELS})

    # ── POST /press — создать пресс-релиз ────────────────────────────────────
    if method == 'POST' and '/press' in p and 'publish' not in p:
        inc_id = body.get('incident_id')
        title = (body.get('title') or '').strip()
        content = (body.get('content') or '').strip()
        channel = body.get('channel', 'public')
        if not title or not content:
            conn.close()
            return err('title и content обязательны')
        inc_code = None
        if inc_id:
            cur.execute(f"SELECT incident_code FROM {S}.egsu_incidents WHERE id = {int(inc_id)}")
            row = cur.fetchone()
            if row:
                inc_code = row[0]
        cur.execute(
            f"INSERT INTO {S}.egsu_press_releases (incident_id, incident_code, title, content, channel, status) "
            f"VALUES ({esc(inc_id)},{esc(inc_code)},{esc(title)},{esc(content)},{esc(channel)},'draft') "
            f"RETURNING id, created_at"
        )
        result = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({'id': result[0], 'created_at': str(result[1]), 'message': 'Пресс-релиз создан, готов к публикации'}, 201)

    # ── POST /press/publish — опубликовать пресс-релиз ───────────────────────
    if method == 'POST' and '/press' in p and 'publish' in p:
        pr_id = body.get('press_id') or body.get('id')
        channels = body.get('channels', CHANNELS)
        if not pr_id:
            conn.close()
            return err('press_id обязателен')
        cur.execute(
            f"UPDATE {S}.egsu_press_releases SET status='published', published_at=NOW(), "
            f"channel={esc(', '.join(channels) if isinstance(channels, list) else str(channels))} "
            f"WHERE id = {int(pr_id)} RETURNING id, title, published_at"
        )
        result = cur.fetchone()
        if not result:
            conn.close()
            return err('Пресс-релиз не найден', 404)
        conn.commit()
        conn.close()
        return ok({
            'id': result[0],
            'title': result[1],
            'published_at': str(result[2]),
            'channels': channels,
            'message': f'Опубликовано в каналах: {", ".join(channels) if isinstance(channels, list) else channels}'
        })

    conn.close()
    return err(f'Маршрут не найден: {method} {path}', 404)
