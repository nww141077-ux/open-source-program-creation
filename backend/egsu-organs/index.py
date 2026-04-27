"""
API органов EGSU — органы, обращения, инциденты, распоряжения, пресса, персонал, диалог, внешние контакты.

GET  /                        — список органов
POST /appeal                  — обращение гражданина
GET  /appeal?ticket_id=X      — статус обращения
GET  /incidents               — лента инцидентов
GET  /orders                  — распоряжения владельца
POST /orders                  — создать распоряжение
GET  /notifications?organ=X   — уведомления органу
POST /notifications/read      — отметить прочитанными
GET  /actions                 — действия реагирования
GET  /press                   — пресс-релизы
POST /press                   — создать пресс-релиз
POST /press/publish           — опубликовать в каналы
GET  /members?organ=CODE      — персонал органа
POST /members                 — добавить участника
DELETE /members               — удалить участника
GET  /dialog?organ=CODE       — чат органа (гражданская позиция)
POST /dialog                  — отправить сообщение в чат
GET  /external-contacts       — внешние контакты органов власти
GET  /external-contacts?category=X — по категории
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

    # ── GET /members — персонал органа ──────────────────────────────────────
    if method == 'GET' and '/members' in p:
        organ = params.get('organ', '')
        where = f"WHERE organ_code = {esc(organ)}" if organ else ""
        cur.execute(f"""
            SELECT * FROM {S}.egsu_organ_members
            {where}
            ORDER BY is_owner DESC, joined_at ASC
        """)
        members = rows_to_list(cur)
        conn.close()
        return ok({'members': members, 'total': len(members)})

    # ── POST /members — добавить участника ───────────────────────────────────
    if method == 'POST' and '/members' in p and 'DELETE' not in method:
        organ_code = (body.get('organ_code') or '').strip()
        full_name = (body.get('full_name') or '').strip()
        role = (body.get('role') or 'Участник').strip()
        position = (body.get('position') or '').strip() or None
        if not organ_code or not full_name:
            conn.close()
            return err('organ_code и full_name обязательны')
        cur.execute(
            f"INSERT INTO {S}.egsu_organ_members (organ_code, full_name, role, position) "
            f"VALUES ({esc(organ_code)},{esc(full_name)},{esc(role)},{esc(position)}) RETURNING id, created_at"
        )
        result = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({'id': result[0], 'created_at': str(result[1]), 'message': 'Участник добавлен'}, 201)

    # ── DELETE /members — удалить участника ──────────────────────────────────
    if method == 'DELETE' and '/members' in p:
        member_id = body.get('id') or params.get('id')
        if not member_id:
            conn.close()
            return err('id участника обязателен')
        cur.execute(f"DELETE FROM {S}.egsu_organ_members WHERE id={int(member_id)} AND is_owner=FALSE")
        conn.commit()
        conn.close()
        return ok({'message': 'Участник удалён'})

    # ── GET /dialog — чат органа ─────────────────────────────────────────────
    if method == 'GET' and '/dialog' in p:
        organ = params.get('organ', '')
        limit = min(int(params.get('limit', 100)), 500)
        where = f"WHERE organ_code = {esc(organ)}" if organ else ""
        cur.execute(f"""
            SELECT * FROM {S}.egsu_organ_dialog
            {where}
            ORDER BY created_at ASC LIMIT {limit}
        """)
        messages = rows_to_list(cur)
        conn.close()
        return ok({'messages': messages, 'total': len(messages)})

    # ── POST /dialog — отправить сообщение в чат ─────────────────────────────
    if method == 'POST' and '/dialog' in p:
        organ_code = (body.get('organ_code') or '').strip()
        author_name = (body.get('author_name') or '').strip()
        message = (body.get('message') or '').strip()
        author_role = (body.get('author_role') or 'Участник').strip()
        is_owner = bool(body.get('is_owner', False))
        msg_type = body.get('msg_type', 'message')
        if not organ_code or not author_name or not message:
            conn.close()
            return err('organ_code, author_name и message обязательны')
        cur.execute(
            f"INSERT INTO {S}.egsu_organ_dialog "
            f"(organ_code, author_name, author_role, is_owner, message, msg_type) "
            f"VALUES ({esc(organ_code)},{esc(author_name)},{esc(author_role)},"
            f"{esc_bool(is_owner)},{esc(message)},{esc(msg_type)}) RETURNING id, created_at"
        )
        result = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({'id': result[0], 'created_at': str(result[1]), 'message': 'Сообщение отправлено'}, 201)

    # ── GET /external-contacts — внешние контакты ────────────────────────────
    if method == 'GET' and '/external-contacts' in p:
        category = params.get('category', '')
        where = f"WHERE is_active=TRUE AND category={esc(category)}" if category else "WHERE is_active=TRUE"
        cur.execute(f"""
            SELECT * FROM {S}.egsu_external_contacts
            {where}
            ORDER BY country, agency_name
        """)
        contacts = rows_to_list(cur)
        conn.close()
        return ok({'contacts': contacts, 'total': len(contacts)})

    # ── POST /reception-forward — запрос в интернет-приёмную ─────────────────
    if method == 'POST' and '/reception-forward' in p:
        organ_code = body.get('organ_code', '')
        contact_id = body.get('external_contact_id')
        agency_name = (body.get('agency_name') or '').strip()
        subject = (body.get('subject') or '').strip()
        message_text = (body.get('message_text') or '').strip()
        url_used = body.get('url_used', '')
        sender_name = body.get('sender_name', 'Николаев Владимир Владимирович')
        if not message_text or not agency_name:
            conn.close()
            return err('agency_name и message_text обязательны')
        cid = int(contact_id) if contact_id else 'NULL'
        cur.execute(
            f"INSERT INTO {S}.egsu_reception_log "
            f"(organ_code, external_contact_id, agency_name, subject, message_text, sender_name, url_used) "
            f"VALUES ({esc(organ_code)},{cid},{esc(agency_name)},{esc(subject)},{esc(message_text)},{esc(sender_name)},{esc(url_used)}) "
            f"RETURNING id, created_at"
        )
        result = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({'id': result[0], 'created_at': str(result[1]), 'message': f'Запрос зарегистрирован и направлен в {agency_name}'}, 201)

    # ── GET /reception-log — журнал отправок ─────────────────────────────────
    if method == 'GET' and '/reception-log' in p:
        organ = params.get('organ', '')
        where = f"WHERE organ_code={esc(organ)}" if organ else ""
        cur.execute(f"SELECT * FROM {S}.egsu_reception_log {where} ORDER BY created_at DESC LIMIT 100")
        logs = rows_to_list(cur)
        conn.close()
        return ok({'logs': logs, 'total': len(logs)})

    # ── GET /strategy — стратегические инициативы ─────────────────────────────
    if method == 'GET' and '/strategy' in p and '/strategy-orders' not in p:
        section = params.get('section', 'humanity')
        cur.execute(f"""
            SELECT * FROM {S}.egsu_strategy_items
            WHERE section = {esc(section)}
            ORDER BY sort_order, created_at
        """)
        items = rows_to_list(cur)
        conn.close()
        return ok({'items': items, 'total': len(items)})

    # ── POST /strategy — создать инициативу ───────────────────────────────────
    if method == 'POST' and '/strategy' in p and '/strategy-orders' not in p:
        title = (body.get('title') or '').strip()
        description = (body.get('description') or '').strip()
        priority = body.get('priority', 'normal')
        status_val = body.get('status', 'draft')
        tags = body.get('tags', '')
        section = body.get('section', 'humanity')
        if not title:
            conn.close()
            return err('title обязателен')
        cur.execute(
            f"INSERT INTO {S}.egsu_strategy_items (section, title, description, priority, status, tags) "
            f"VALUES ({esc(section)},{esc(title)},{esc(description)},{esc(priority)},{esc(status_val)},{esc(tags)}) "
            f"RETURNING id, created_at"
        )
        result = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({'id': result[0], 'created_at': str(result[1]), 'message': 'Инициатива создана'}, 201)

    # ── PUT /strategy — обновить инициативу ───────────────────────────────────
    if method == 'PUT' and '/strategy' in p and '/strategy-orders' not in p:
        item_id = body.get('id')
        if not item_id:
            conn.close()
            return err('id обязателен')
        updates = []
        for field in ['title', 'description', 'priority', 'status', 'tags']:
            if field in body:
                updates.append(f"{field}={esc(body[field])}")
        updates.append("updated_at=NOW()")
        cur.execute(f"UPDATE {S}.egsu_strategy_items SET {', '.join(updates)} WHERE id={int(item_id)} RETURNING id, updated_at")
        result = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({'id': result[0] if result else item_id, 'message': 'Инициатива обновлена'})

    # ── GET /strategy-orders — распоряжения по стратегии ──────────────────────
    if method == 'GET' and '/strategy-orders' in p:
        item_id = params.get('item_id')
        where = f"WHERE strategy_item_id={int(item_id)}" if item_id else ""
        cur.execute(f"""
            SELECT so.*, si.title as initiative_title
            FROM {S}.egsu_strategy_orders so
            LEFT JOIN {S}.egsu_strategy_items si ON si.id = so.strategy_item_id
            {where}
            ORDER BY so.created_at DESC
        """)
        orders = rows_to_list(cur)
        conn.close()
        return ok({'orders': orders, 'total': len(orders)})

    # ── POST /strategy-orders — создать распоряжение по инициативе ────────────
    if method == 'POST' and '/strategy-orders' in p:
        title = (body.get('title') or '').strip()
        order_text = (body.get('order_text') or '').strip()
        target_organ = (body.get('target_organ') or '').strip()
        target_external = body.get('target_external', '')
        priority = body.get('priority', 'normal')
        item_id = body.get('strategy_item_id')
        if not order_text or not target_organ:
            conn.close()
            return err('order_text и target_organ обязательны')
        sid = int(item_id) if item_id else 'NULL'
        cur.execute(
            f"INSERT INTO {S}.egsu_strategy_orders "
            f"(strategy_item_id, title, order_text, target_organ, target_external, priority) "
            f"VALUES ({sid},{esc(title)},{esc(order_text)},{esc(target_organ)},{esc(target_external)},{esc(priority)}) "
            f"RETURNING id, created_at"
        )
        result = cur.fetchone()
        # Также добавляем в общий журнал органа
        cur.execute(
            f"INSERT INTO {S}.egsu_owner_orders "
            f"(incident_id, order_text, target_organ, priority) "
            f"SELECT i.id, {esc('[Стратегия] ' + order_text)}, {esc(target_organ)}, {esc(priority)} "
            f"FROM {S}.egsu_incidents i WHERE i.responsible_organ={esc(target_organ)} LIMIT 1"
        )
        conn.commit()
        conn.close()
        return ok({'id': result[0], 'created_at': str(result[1]), 'message': f'Распоряжение направлено в орган {target_organ}'}, 201)

    # ── PUT /strategy-orders — изменить статус распоряжения ───────────────────
    if method == 'PUT' and '/strategy-orders' in p:
        order_id = body.get('id')
        new_status = body.get('status', 'approved')
        forwarded = body.get('forwarded_to', '')
        response = body.get('organ_response', '')
        if not order_id:
            conn.close()
            return err('id обязателен')
        cur.execute(
            f"UPDATE {S}.egsu_strategy_orders SET status={esc(new_status)}, "
            f"forwarded_to={esc(forwarded)}, organ_response={esc(response)}, updated_at=NOW() "
            f"WHERE id={int(order_id)} RETURNING id, status"
        )
        result = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({'id': result[0] if result else order_id, 'status': result[1] if result else new_status, 'message': 'Статус обновлён'})

    conn.close()
    return err(f'Маршрут не найден: {method} {path}', 404)