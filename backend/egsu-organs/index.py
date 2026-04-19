"""
API органов ECSU — получение списка органов и работа с обращениями граждан.
Поддерживает:
  GET  /           — список всех активных органов ECSU, отсортированных по порядку
  POST /appeal     — создание нового обращения гражданина в орган ECSU
  GET  /appeal     — проверка статуса обращения по ticket_id
"""
import json
import os
import time
import psycopg2
from psycopg2.extras import RealDictCursor

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def esc(value: str) -> str:
    """Экранирует строку для безопасной вставки в SQL (Simple Query Protocol)."""
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def esc_bool(value) -> str:
    return 'TRUE' if value else 'FALSE'


def gen_ticket_id(organ_code: str) -> str:
    """Генерирует уникальный ticket_id формата ECSU-{SHORT}-{timestamp_last6}."""
    short = (organ_code or 'GEN').upper().replace('-', '')[:6]
    ts_last6 = str(int(time.time()))[-6:]
    return f'ECSU-{short}-{ts_last6}'


def handler(event: dict, context) -> dict:
    """
    Обработчик запросов для API органов ECSU.

    Маршруты:
      OPTIONS *        — ответ на preflight CORS-запрос
      GET  /           — вернуть список всех активных органов (is_active=TRUE),
                         отсортированных по полю sort_order
      POST /appeal     — принять обращение гражданина, сгенерировать ticket_id,
                         сохранить в egsu_citizen_appeals, вернуть ticket_id и created_at
      GET  /appeal     — вернуть статус и данные обращения по параметру ticket_id
    """
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    # --- CORS preflight ---
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    # Нормализуем путь: убираем trailing slash для единообразия
    clean_path = path.rstrip('/')

    # -----------------------------------------------------------------------
    # GET / — список активных органов
    # -----------------------------------------------------------------------
    if method == 'GET' and not clean_path.endswith('/appeal'):
        try:
            conn = get_db()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                'SELECT * FROM egsu_organs WHERE is_active = TRUE ORDER BY sort_order ASC'
            )
            rows = cur.fetchall()
            conn.close()
            organs = [dict(r) for r in rows]
            return {
                'statusCode': 200,
                'headers': HEADERS,
                'body': json.dumps({'organs': organs, 'total': len(organs)}, default=str, ensure_ascii=False)
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Ошибка получения списка органов', 'detail': str(e)}, ensure_ascii=False)
            }

    # -----------------------------------------------------------------------
    # GET /appeal?ticket_id=XXX — статус обращения
    # -----------------------------------------------------------------------
    if method == 'GET' and clean_path.endswith('/appeal'):
        params = event.get('queryStringParameters') or {}
        ticket_id = params.get('ticket_id', '').strip()
        if not ticket_id:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Параметр ticket_id обязателен'}, ensure_ascii=False)
            }
        try:
            conn = get_db()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                f"SELECT * FROM egsu_citizen_appeals WHERE ticket_id = {esc(ticket_id)} LIMIT 1"
            )
            row = cur.fetchone()
            conn.close()
            if not row:
                return {
                    'statusCode': 404,
                    'headers': HEADERS,
                    'body': json.dumps({'error': 'Обращение не найдено', 'ticket_id': ticket_id}, ensure_ascii=False)
                }
            return {
                'statusCode': 200,
                'headers': HEADERS,
                'body': json.dumps({'appeal': dict(row)}, default=str, ensure_ascii=False)
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Ошибка получения статуса обращения', 'detail': str(e)}, ensure_ascii=False)
            }

    # -----------------------------------------------------------------------
    # POST /appeal — создать новое обращение
    # -----------------------------------------------------------------------
    if method == 'POST' and clean_path.endswith('/appeal'):
        try:
            body = json.loads(event.get('body') or '{}')
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Некорректный JSON в теле запроса'}, ensure_ascii=False)
            }

        organ_code = (body.get('organ_code') or '').strip()
        category = (body.get('category') or '').strip()
        subject = (body.get('subject') or '').strip()
        description = (body.get('description') or '').strip()
        location = (body.get('location') or '').strip()
        evidence_desc = (body.get('evidence_desc') or '').strip()
        contact_email = (body.get('contact_email') or '').strip()
        contact_phone = (body.get('contact_phone') or '').strip()
        is_anonymous = bool(body.get('is_anonymous', False))

        # Валидация обязательных полей
        missing = [f for f, v in [('organ_code', organ_code), ('subject', subject), ('description', description)] if not v]
        if missing:
            return {
                'statusCode': 422,
                'headers': HEADERS,
                'body': json.dumps(
                    {'error': 'Отсутствуют обязательные поля', 'missing': missing},
                    ensure_ascii=False
                )
            }

        ticket_id = gen_ticket_id(organ_code)

        try:
            conn = get_db()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            sql = (
                f"INSERT INTO egsu_citizen_appeals "
                f"(ticket_id, organ_code, category, subject, description, location, evidence_desc, "
                f"contact_email, contact_phone, is_anonymous, status) "
                f"VALUES ("
                f"{esc(ticket_id)}, "
                f"{esc(organ_code)}, "
                f"{esc(category) if category else 'NULL'}, "
                f"{esc(subject)}, "
                f"{esc(description)}, "
                f"{esc(location) if location else 'NULL'}, "
                f"{esc(evidence_desc) if evidence_desc else 'NULL'}, "
                f"{esc(contact_email) if contact_email else 'NULL'}, "
                f"{esc(contact_phone) if contact_phone else 'NULL'}, "
                f"{esc_bool(is_anonymous)}, "
                f"'new'"
                f") RETURNING ticket_id, created_at"
            )
            cur.execute(sql)
            result = cur.fetchone()
            conn.commit()
            conn.close()
            return {
                'statusCode': 201,
                'headers': HEADERS,
                'body': json.dumps(
                    {
                        'success': True,
                        'ticket_id': result['ticket_id'],
                        'created_at': str(result['created_at']),
                        'message': 'Обращение успешно зарегистрировано в системе ECSU'
                    },
                    ensure_ascii=False
                )
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Ошибка сохранения обращения', 'detail': str(e)}, ensure_ascii=False)
            }

    # --- Маршрут не найден ---
    return {
        'statusCode': 404,
        'headers': HEADERS,
        'body': json.dumps({'error': 'Маршрут не найден', 'path': path, 'method': method}, ensure_ascii=False)
    }
