"""
ECSU Графиум — блокнот-заметки системы.
Создание, редактирование, удаление заметок. Хранение в БД.
"""
import json
import os
from datetime import datetime
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SCHEMA = "t_p38294978_open_source_program_"


def resp(code: int, body: dict) -> dict:
    return {"statusCode": code, "headers": CORS,
            "body": json.dumps(body, ensure_ascii=False, default=str)}


def handler(event: dict, context) -> dict:
    """ECSU Графиум — блокнот-заметки. CRUD операции."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs     = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur  = conn.cursor()

    try:
        # ── GET — список заметок ─────────────────────────────────────────
        if method == "GET":
            archived  = qs.get("archived", "false") == "true"
            note_type = qs.get("type", "")
            tag       = qs.get("tag", "")
            search    = qs.get("q", "")

            where = [f"is_archived = {archived}"]
            params = []

            if note_type:
                where.append("note_type = %s"); params.append(note_type)
            if tag:
                where.append("%s = ANY(tags)"); params.append(tag)
            if search:
                where.append("(title ILIKE %s OR content ILIKE %s)")
                params += [f"%{search}%", f"%{search}%"]

            w = " AND ".join(where)
            cur.execute(f"""
                SELECT id, title, content, note_type, tags, color,
                       is_pinned, is_archived, created_at, updated_at
                FROM {SCHEMA}.egsu_graphium_notes
                WHERE {w}
                ORDER BY is_pinned DESC, updated_at DESC
                LIMIT 200
            """, params)

            rows = cur.fetchall()
            notes = [{
                "id": r[0], "title": r[1], "content": r[2],
                "note_type": r[3], "tags": r[4] or [],
                "color": r[5], "is_pinned": r[6], "is_archived": r[7],
                "created_at": r[8].isoformat() if r[8] else None,
                "updated_at": r[9].isoformat() if r[9] else None,
            } for r in rows]

            return resp(200, {"notes": notes, "total": len(notes)})

        # ── POST — создать заметку ───────────────────────────────────────
        if method == "POST":
            body      = json.loads(event.get("body") or "{}")
            title     = body.get("title", "")
            content   = body.get("content", "")
            note_type = body.get("note_type", "note")
            tags      = body.get("tags", [])
            color     = body.get("color", "default")
            is_pinned = body.get("is_pinned", False)

            cur.execute(f"""
                INSERT INTO {SCHEMA}.egsu_graphium_notes
                    (title, content, note_type, tags, color, is_pinned)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
            """, (title, content, note_type, tags, color, is_pinned))

            row = cur.fetchone()
            conn.commit()
            return resp(200, {"ok": True, "id": row[0],
                              "created_at": row[1].isoformat() if row[1] else None})

        # ── PUT — обновить заметку ───────────────────────────────────────
        if method == "PUT":
            body      = json.loads(event.get("body") or "{}")
            note_id   = body.get("id")
            if not note_id:
                return resp(400, {"error": "id required"})

            fields = []
            params = []
            for key in ("title", "content", "note_type", "color"):
                if key in body:
                    fields.append(f"{key} = %s"); params.append(body[key])
            if "tags" in body:
                fields.append("tags = %s"); params.append(body["tags"])
            if "is_pinned" in body:
                fields.append("is_pinned = %s"); params.append(body["is_pinned"])
            if "is_archived" in body:
                fields.append("is_archived = %s"); params.append(body["is_archived"])

            fields.append("updated_at = NOW()")
            params.append(note_id)

            if len(fields) > 1:
                cur.execute(f"""
                    UPDATE {SCHEMA}.egsu_graphium_notes
                    SET {", ".join(fields)}
                    WHERE id = %s
                """, params)
                conn.commit()

            return resp(200, {"ok": True})

        # ── DELETE — удалить заметку ─────────────────────────────────────
        if method == "DELETE":
            body    = json.loads(event.get("body") or "{}")
            note_id = body.get("id")
            cur.execute(f"DELETE FROM {SCHEMA}.egsu_graphium_notes WHERE id = %s", (note_id,))
            conn.commit()
            return resp(200, {"ok": True})

    finally:
        cur.close()
        conn.close()

    return resp(404, {"error": "not found"})
