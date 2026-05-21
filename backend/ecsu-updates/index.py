"""
ECSU App Updates — управление обновлениями приложения.
Сайт создаёт обновления → ПК-агент забирает и применяет.
"""
import json
import os
from datetime import datetime, timezone
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Agent-Id",
}


def handler(event: dict, context) -> dict:
    """Управление обновлениями ECSU — создание, получение, подтверждение применения."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path   = event.get("path", "/")
    qs     = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur  = conn.cursor()

    # ── GET /  — список всех обновлений (для сайта) ──────────────────────
    if method == "GET" and path in ("/", ""):
        cur.execute("""
            SELECT u.id, u.version, u.title, u.description, u.update_type,
                   u.payload, u.files, u.created_by, u.created_at, u.status,
                   COUNT(l.id) AS applied_count
            FROM ecsu_app_updates u
            LEFT JOIN ecsu_update_log l ON l.update_id = u.id
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT 100
        """)
        rows = cur.fetchall()
        updates = []
        for r in rows:
            updates.append({
                "id": r[0], "version": r[1], "title": r[2],
                "description": r[3], "update_type": r[4],
                "payload": r[5] or {}, "files": r[6] or [],
                "created_by": r[7],
                "created_at": r[8].isoformat() if r[8] else None,
                "status": r[9], "applied_count": r[10],
            })
        cur.close(); conn.close()
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"updates": updates, "total": len(updates)})}

    # ── GET /?action=pending&agent_id=XXX — обновления для ПК-агента ──────
    if method == "GET" and qs.get("action") == "pending":
        agent_id = qs.get("agent_id", "")
        # Берём обновления, которые этот агент ещё НЕ применял
        cur.execute("""
            SELECT u.id, u.version, u.title, u.description, u.update_type,
                   u.payload, u.files, u.created_at
            FROM ecsu_app_updates u
            WHERE u.status = 'active'
              AND u.id NOT IN (
                  SELECT update_id FROM ecsu_update_log WHERE agent_id = %s
              )
            ORDER BY u.created_at ASC
        """, (agent_id,))
        rows = cur.fetchall()
        updates = []
        for r in rows:
            updates.append({
                "id": r[0], "version": r[1], "title": r[2],
                "description": r[3], "update_type": r[4],
                "payload": r[5] or {}, "files": r[6] or [],
                "created_at": r[7].isoformat() if r[7] else None,
            })
        cur.close(); conn.close()
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"pending": updates, "count": len(updates),
                                    "agent_id": agent_id})}

    # ── POST / — создать или применить обновление (action в body) ──────────
    if method == "POST":
        body   = json.loads(event.get("body") or "{}")
        action = body.get("action", "create")

        # Агент сообщает что применил обновления
        if action == "applied":
            agent_id   = body.get("agent_id", "")
            hostname   = body.get("hostname", "")
            update_ids = body.get("update_ids", [])
            result     = body.get("result", "ok")
            for uid in update_ids:
                cur.execute("""
                    INSERT INTO ecsu_update_log (update_id, agent_id, hostname, result)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (uid, agent_id, hostname, result))
            conn.commit()
            cur.close(); conn.close()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"ok": True, "recorded": len(update_ids)})}

        # Создать новое обновление (действие по умолчанию)
        version     = body.get("version", "")
        title       = body.get("title", "")
        description = body.get("description", "")
        update_type = body.get("update_type", "patch")
        payload     = body.get("payload", {})
        files       = body.get("files", [])
        created_by  = body.get("created_by", "admin")
        status      = body.get("status", "active")

        if not title:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": "title required"})}

        cur.execute("""
            INSERT INTO ecsu_app_updates
                (version, title, description, update_type, payload, files, created_by, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (version, title, description, update_type,
              json.dumps(payload), json.dumps(files), created_by, status))
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close(); conn.close()
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"ok": True, "id": new_id})}

    # ── PUT / — изменить статус обновления ────────────────────────────────
    if method == "PUT":
        body   = json.loads(event.get("body") or "{}")
        uid    = body.get("id")
        status = body.get("status", "active")
        cur.execute("UPDATE ecsu_app_updates SET status = %s WHERE id = %s",
                    (status, uid))
        conn.commit()
        cur.close(); conn.close()
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"ok": True})}

    # ── DELETE /  — удалить обновление ───────────────────────────────────
    if method == "DELETE":
        body = json.loads(event.get("body") or "{}")
        uid  = body.get("id")
        cur.execute("DELETE FROM ecsu_update_log WHERE update_id = %s", (uid,))
        cur.execute("DELETE FROM ecsu_app_updates WHERE id = %s", (uid,))
        conn.commit()
        cur.close(); conn.close()
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"ok": True})}

    cur.close(); conn.close()
    return {"statusCode": 404, "headers": CORS,
            "body": json.dumps({"error": "not found"})}