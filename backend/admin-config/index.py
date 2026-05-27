"""
Управление конфигурацией системы ECSU DALAN.
Получение и сохранение всех настроек, модулей и конфигурации Dalan.
"""
import json
import os
import psycopg2

SCHEMA = "t_p38294978_open_source_program_"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "settings")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET ?action=settings
        if method == "GET" and action == "settings":
            cur.execute(f"SELECT key, value, category, label FROM {SCHEMA}.app_settings ORDER BY category, key")
            rows = cur.fetchall()
            result = {}
            for key, value, category, label in rows:
                if category not in result:
                    result[category] = []
                result[category].append({"key": key, "value": value, "label": label or key})
            return {"statusCode": 200, "headers": headers, "body": json.dumps(result, ensure_ascii=False)}

        # GET ?action=modules
        if method == "GET" and action == "modules":
            cur.execute(f"SELECT id, name, label, enabled FROM {SCHEMA}.app_modules ORDER BY id")
            rows = cur.fetchall()
            modules = [{"id": r[0], "name": r[1], "label": r[2], "enabled": r[3]} for r in rows]
            return {"statusCode": 200, "headers": headers, "body": json.dumps(modules, ensure_ascii=False)}

        # GET ?action=dalan
        if method == "GET" and action == "dalan":
            cur.execute(f"SELECT param_key, param_value, param_label, param_type FROM {SCHEMA}.dalan_config ORDER BY id")
            rows = cur.fetchall()
            params_list = [{"key": r[0], "value": r[1], "label": r[2], "type": r[3]} for r in rows]
            return {"statusCode": 200, "headers": headers, "body": json.dumps(params_list, ensure_ascii=False)}

        # POST ?action=save_setting
        if method == "POST" and action == "save_setting":
            body = json.loads(event.get("body") or "{}")
            key = body.get("key")
            value = body.get("value", "")
            cur.execute(
                f"UPDATE {SCHEMA}.app_settings SET value=%s, updated_at=now() WHERE key=%s",
                (str(value), key)
            )
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        # POST ?action=save_module
        if method == "POST" and action == "save_module":
            body = json.loads(event.get("body") or "{}")
            module_id = body.get("id")
            enabled = body.get("enabled", True)
            cur.execute(
                f"UPDATE {SCHEMA}.app_modules SET enabled=%s, updated_at=now() WHERE id=%s",
                (enabled, module_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        # POST ?action=save_dalan
        if method == "POST" and action == "save_dalan":
            body = json.loads(event.get("body") or "{}")
            key = body.get("key")
            value = body.get("value", "")
            cur.execute(
                f"UPDATE {SCHEMA}.dalan_config SET param_value=%s, updated_at=now() WHERE param_key=%s",
                (str(value), key)
            )
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Unknown action"})}

    finally:
        cur.close()
        conn.close()
