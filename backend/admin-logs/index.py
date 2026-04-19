import os
import json
import hashlib
import hmac
import base64
import time
import psycopg2

SCHEMA = "t_p38294978_open_source_program_"
SECRET = "egsu_admin_secret_key_2024"


def verify_token(token: str) -> str | None:
    try:
        b64, sig = token.rsplit(".", 1)
        expected = hmac.new(SECRET.encode(), b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(b64).decode())
        if payload["exp"] < int(time.time()):
            return None
        return payload["u"]
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    """Журнал действий администратора и управление резервными копиями"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    auth_header = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    user = verify_token(token)
    if not user:
        return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Не авторизован"})}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # GET /logs
    if method == "GET" and "/backup" not in path:
        cur.execute(
            f"SELECT id, action, details, username, created_at FROM {SCHEMA}.admin_logs ORDER BY created_at DESC LIMIT 100"
        )
        logs = [
            {"id": r[0], "action": r[1], "details": r[2], "username": r[3], "created_at": r[4].isoformat()}
            for r in cur.fetchall()
        ]
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"logs": logs})}

    # GET /backup — список резервных копий
    if method == "GET" and "/backup" in path:
        cur.execute(
            f"SELECT id, label, created_at FROM {SCHEMA}.admin_backups ORDER BY created_at DESC LIMIT 5"
        )
        backups = [{"id": r[0], "label": r[1], "created_at": r[2].isoformat()} for r in cur.fetchall()]
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"backups": backups})}

    # POST /backup — создать резервную копию
    if method == "POST" and "/backup" in path and "/restore" not in path:
        cur.execute(f"SELECT key, value FROM {SCHEMA}.app_settings")
        settings = {r[0]: r[1] for r in cur.fetchall()}
        cur.execute(f"SELECT name, label, enabled FROM {SCHEMA}.app_modules")
        modules = [{"name": r[0], "label": r[1], "enabled": r[2]} for r in cur.fetchall()]

        label = f"Резервная копия {time.strftime('%d.%m.%Y %H:%M')}"
        cur.execute(
            f"INSERT INTO {SCHEMA}.admin_backups (label, settings_json, modules_json) VALUES (%s, %s, %s)",
            (label, json.dumps(settings, ensure_ascii=False), json.dumps(modules, ensure_ascii=False))
        )
        # Оставляем только 5 последних
        cur.execute(
            f"DELETE FROM {SCHEMA}.admin_backups WHERE id NOT IN (SELECT id FROM {SCHEMA}.admin_backups ORDER BY created_at DESC LIMIT 5)"
        )
        cur.execute(f"INSERT INTO {SCHEMA}.admin_logs (action, username) VALUES (%s, %s)", ("Создана резервная копия", user))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True, "label": label})}

    # POST /restore — восстановить резервную копию
    if method == "POST" and "/restore" in path:
        body = json.loads(event.get("body") or "{}")
        backup_id = body.get("id")
        cur.execute(f"SELECT settings_json, modules_json, label FROM {SCHEMA}.admin_backups WHERE id = %s", (backup_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Резервная копия не найдена"})}

        settings = json.loads(row[0])
        modules = json.loads(row[1])
        label = row[2]

        for key, value in settings.items():
            cur.execute(
                f"INSERT INTO {SCHEMA}.app_settings (key, value, updated_at) VALUES (%s, %s, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                (key, value)
            )
        for m in modules:
            cur.execute(f"UPDATE {SCHEMA}.app_modules SET enabled = %s, updated_at = NOW() WHERE name = %s", (m["enabled"], m["name"]))

        cur.execute(f"INSERT INTO {SCHEMA}.admin_logs (action, details, username) VALUES (%s, %s, %s)",
                    ("Восстановлена резервная копия", label, user))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}
