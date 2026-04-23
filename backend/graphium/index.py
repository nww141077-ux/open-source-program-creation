"""
Графиум — блокнот ECSU 2.0
Управление личными заметками: создание, редактирование, архивирование, фильтрация.
Поддерживает типы заметок, теги, цвета и закреплённые записи.
"""
import json
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

S = "t_p38294978_open_source_program_"
TABLE = f"{S}.egsu_graphium_notes"

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Content-Type': 'application/json'
}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def esc(val):
    """Экранирование строки для безопасной подстановки в SQL."""
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"


def esc_bool(val):
    return 'TRUE' if val else 'FALSE'


def esc_array(arr):
    """Экранирование массива строк в формат PostgreSQL text[]."""
    if not arr:
        return "ARRAY[]::text[]"
    items = ','.join("'" + str(v).replace("'", "''") + "'" for v in arr)
    return f'ARRAY[{items}]'


def extract_id(path: str):
    """Извлекает числовой ID из конца пути."""
    parts = path.rstrip('/').split('/')
    try:
        return int(parts[-1])
    except (ValueError, IndexError):
        return None


def handler(event: dict, context) -> dict:
    """
    Обработчик HTTP-запросов блокнота Графиум.

    GET /               — список активных заметок (закреплённые сверху, затем по дате)
    GET /?archived=true — список архивных заметок
    POST /              — создать новую заметку
    PUT /{id}           — обновить существующую заметку (любые поля)
    DELETE /{id}        — архивировать заметку (is_archived=true), физического удаления нет
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    params = event.get('queryStringParameters') or {}
    note_id = extract_id(path)

    # -----------------------------------------------------------------------
    # GET / — список заметок
    # -----------------------------------------------------------------------
    if method == 'GET' and not note_id:
        archived = params.get('archived', 'false').lower() == 'true'
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        archived_val = 'TRUE' if archived else 'FALSE'
        cur.execute(f"""
            SELECT * FROM {TABLE}
            WHERE is_archived = {archived_val}
            ORDER BY is_pinned DESC, updated_at DESC
        """)
        rows = cur.fetchall()
        conn.close()
        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps([dict(r) for r in rows], default=str, ensure_ascii=False)
        }

    # -----------------------------------------------------------------------
    # POST / — создать заметку
    # -----------------------------------------------------------------------
    if method == 'POST' and not note_id:
        body = json.loads(event.get('body') or '{}')

        title = body.get('title', '')
        if not title:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Поле title обязательно'}, ensure_ascii=False)
            }

        content = body.get('content', '')
        note_type = body.get('note_type', 'note')
        tags = body.get('tags', [])
        color = body.get('color', 'default')
        is_pinned = body.get('is_pinned', False)
        now = datetime.now()

        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"""
            INSERT INTO {TABLE}
                (title, content, note_type, tags, color, is_pinned, is_archived, created_at, updated_at)
            VALUES (
                {esc(title)},
                {esc(content)},
                {esc(note_type)},
                {esc_array(tags)},
                {esc(color)},
                {esc_bool(is_pinned)},
                FALSE,
                '{now.isoformat()}',
                '{now.isoformat()}'
            )
            RETURNING *
        """)
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {
            'statusCode': 201,
            'headers': HEADERS,
            'body': json.dumps(dict(row), default=str, ensure_ascii=False)
        }

    # -----------------------------------------------------------------------
    # PUT /{id} — обновить заметку
    # -----------------------------------------------------------------------
    if method == 'PUT' and note_id:
        body = json.loads(event.get('body') or '{}')
        if not body:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Тело запроса пустое'}, ensure_ascii=False)
            }

        allowed = {'title', 'content', 'note_type', 'tags', 'color', 'is_pinned', 'is_archived'}
        set_parts = []
        for key in allowed:
            if key not in body:
                continue
            val = body[key]
            if key == 'tags':
                set_parts.append(f"{key} = {esc_array(val)}")
            elif key in ('is_pinned', 'is_archived'):
                set_parts.append(f"{key} = {esc_bool(val)}")
            else:
                set_parts.append(f"{key} = {esc(val)}")

        if not set_parts:
            return {
                'statusCode': 400,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Нет допустимых полей для обновления'}, ensure_ascii=False)
            }

        now = datetime.now()
        set_parts.append(f"updated_at = '{now.isoformat()}'")
        set_clause = ', '.join(set_parts)

        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"""
            UPDATE {TABLE}
            SET {set_clause}
            WHERE id = {note_id}
            RETURNING *
        """)
        row = cur.fetchone()
        conn.commit()
        conn.close()

        if not row:
            return {
                'statusCode': 404,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Заметка не найдена'}, ensure_ascii=False)
            }

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps(dict(row), default=str, ensure_ascii=False)
        }

    # -----------------------------------------------------------------------
    # DELETE /{id} — архивировать заметку
    # -----------------------------------------------------------------------
    if method == 'DELETE' and note_id:
        now = datetime.now()
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"""
            UPDATE {TABLE}
            SET is_archived = TRUE, updated_at = '{now.isoformat()}'
            WHERE id = {note_id}
            RETURNING id, title, is_archived
        """)
        row = cur.fetchone()
        conn.commit()
        conn.close()

        if not row:
            return {
                'statusCode': 404,
                'headers': HEADERS,
                'body': json.dumps({'error': 'Заметка не найдена'}, ensure_ascii=False)
            }

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({'message': 'Заметка архивирована', **dict(row)}, default=str, ensure_ascii=False)
        }

    return {
        'statusCode': 405,
        'headers': HEADERS,
        'body': json.dumps({'error': 'Метод не поддерживается'}, ensure_ascii=False)
    }