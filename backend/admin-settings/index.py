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


def auth(event: dict):
    auth_header = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    return verify_token(token)


def handler(event: dict, context) -> dict:
    """Управление настройками и модулями приложения"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    user = auth(event)
    if not user:
        return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Не авторизован"})}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # GET /settings — получить все настройки + модули
    if method == "GET" and "/modules" not in path:
        cur.execute(f"SELECT key, value FROM {SCHEMA}.app_settings ORDER BY key")
        settings = {r[0]: r[1] for r in cur.fetchall()}
        cur.execute(f"SELECT name, label, enabled FROM {SCHEMA}.app_modules ORDER BY name")
        modules = [{"name": r[0], "label": r[1], "enabled": r[2]} for r in cur.fetchall()]
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"settings": settings, "modules": modules})}

    # POST /settings — сохранить настройки
    if method == "POST" and "/modules" not in path:
        body = json.loads(event.get("body") or "{}")
        settings = body.get("settings", {})
        for key, value in settings.items():
            cur.execute(
                f"INSERT INTO {SCHEMA}.app_settings (key, value, updated_at) VALUES (%s, %s, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                (key, str(value))
            )
        cur.execute(f"INSERT INTO {SCHEMA}.admin_logs (action, details, username) VALUES (%s, %s, %s)",
                    ("Обновлены настройки приложения", json.dumps(settings, ensure_ascii=False), user))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    # GET /modules — получить модули
    if method == "GET" and "/modules" in path:
        cur.execute(f"SELECT name, label, enabled FROM {SCHEMA}.app_modules ORDER BY name")
        modules = [{"name": r[0], "label": r[1], "enabled": r[2]} for r in cur.fetchall()]
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"modules": modules})}

    # POST /modules — обновить состояние модулей
    if method == "POST" and "/modules" in path:
        body = json.loads(event.get("body") or "{}")
        modules = body.get("modules", [])
        for m in modules:
            cur.execute(
                f"UPDATE {SCHEMA}.app_modules SET enabled = %s, updated_at = NOW() WHERE name = %s",
                (m["enabled"], m["name"])
            )
        cur.execute(f"INSERT INTO {SCHEMA}.admin_logs (action, details, username) VALUES (%s, %s, %s)",
                    ("Обновлены модули", json.dumps(modules, ensure_ascii=False), user))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}
