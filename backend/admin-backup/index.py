"""
Система создания и восстановления точек восстановления системы ECSU DALAN.
Сохраняет полный снимок конфигурации и позволяет откатиться к любой точке.
"""
import json
import os
import psycopg2
from datetime import datetime

SCHEMA = "t_p38294978_open_source_program_"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "list")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET ?action=list — список точек восстановления
        if method == "GET" and action == "list":
            cur.execute(
                f"SELECT id, label, modules_count, note, created_at FROM {SCHEMA}.admin_backups ORDER BY created_at DESC"
            )
            rows = cur.fetchall()
            backups = [
                {
                    "id": r[0],
                    "label": r[1],
                    "modules_count": r[2],
                    "note": r[3],
                    "created_at": r[4].isoformat() if r[4] else None
                }
                for r in rows
            ]
            return {"statusCode": 200, "headers": headers, "body": json.dumps(backups, ensure_ascii=False)}

        # POST ?action=create — создать точку восстановления
        if method == "POST" and action == "create":
            body = json.loads(event.get("body") or "{}")
            label = body.get("label", f"Точка {datetime.now().strftime('%d.%m.%Y %H:%M')}")
            note = body.get("note", "")

            cur.execute(f"SELECT key, value, category, label FROM {SCHEMA}.app_settings")
            settings = [{"key": r[0], "value": r[1], "category": r[2], "label": r[3]} for r in cur.fetchall()]

            cur.execute(f"SELECT id, name, label, enabled FROM {SCHEMA}.app_modules")
            modules = [{"id": r[0], "name": r[1], "label": r[2], "enabled": r[3]} for r in cur.fetchall()]

            cur.execute(f"SELECT param_key, param_value, param_label, param_type FROM {SCHEMA}.dalan_config")
            dalan = [{"key": r[0], "value": r[1], "label": r[2], "type": r[3]} for r in cur.fetchall()]

            cur.execute(
                f"""INSERT INTO {SCHEMA}.admin_backups 
                (label, settings_json, modules_json, dalan_config_json, modules_count, note)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                (label, json.dumps(settings), json.dumps(modules), json.dumps(dalan), len(modules), note)
            )
            backup_id = cur.fetchone()[0]
            conn.commit()

            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True, "id": backup_id, "label": label})}

        # POST ?action=restore — восстановить из точки
        if method == "POST" and action == "restore":
            body = json.loads(event.get("body") or "{}")
            backup_id = body.get("id")

            cur.execute(
                f"SELECT settings_json, modules_json, dalan_config_json FROM {SCHEMA}.admin_backups WHERE id=%s",
                (backup_id,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Точка не найдена"})}

            settings = json.loads(row[0])
            modules = json.loads(row[1])
            dalan = json.loads(row[2] or "[]")

            for s in settings:
                cur.execute(
                    f"UPDATE {SCHEMA}.app_settings SET value=%s, updated_at=now() WHERE key=%s",
                    (s["value"], s["key"])
                )
            for m in modules:
                cur.execute(
                    f"UPDATE {SCHEMA}.app_modules SET enabled=%s, updated_at=now() WHERE name=%s",
                    (m["enabled"], m["name"])
                )
            for d in dalan:
                cur.execute(
                    f"UPDATE {SCHEMA}.dalan_config SET param_value=%s, updated_at=now() WHERE param_key=%s",
                    (d["value"], d["key"])
                )

            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        # POST ?action=delete — удалить точку
        if method == "POST" and action == "delete":
            body = json.loads(event.get("body") or "{}")
            backup_id = body.get("id")
            cur.execute(f"DELETE FROM {SCHEMA}.admin_backups WHERE id=%s", (backup_id,))
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Unknown action"})}

    finally:
        cur.close()
        conn.close()
