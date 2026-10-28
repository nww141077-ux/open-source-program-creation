"""
Директива автосинхронизации DALAN с локальным ПК через шлюз.
Автовыбор источника: если ПК онлайн — использует его, иначе облако.
Хранит конфиг синхронизации, статус шлюза, лог синхронизаций.
"""
import json
import os
import psycopg2
import urllib.request
import urllib.error
from datetime import datetime

SCHEMA = "t_p38294978_open_source_program_"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_gateway_url(cur):
    cur.execute(f"""
        SELECT param_value FROM {SCHEMA}.app_settings
        WHERE param_key = 'gateway_url' LIMIT 1
    """)
    row = cur.fetchone()
    return row[0] if row and row[0] else None

def get_gateway_enabled(cur):
    cur.execute(f"""
        SELECT param_value FROM {SCHEMA}.app_settings
        WHERE param_key = 'gateway_enabled' LIMIT 1
    """)
    row = cur.fetchone()
    return row and row[0] == "true"

def ping_gateway(url):
    if not url:
        return False
    try:
        req = urllib.request.Request(f"{url.rstrip('/')}/ping", method="GET")
        resp = urllib.request.urlopen(req, timeout=5)
        return resp.status == 200
    except Exception:
        return False

def get_dalan_config(cur):
    cur.execute(f"SELECT param_key, param_value, param_label, param_type FROM {SCHEMA}.dalan_config")
    rows = cur.fetchall()
    return [{"key": r[0], "value": r[1], "label": r[2], "type": r[3]} for r in rows]

def log_sync(cur, source, status, details=""):
    cur.execute(f"""
        INSERT INTO {SCHEMA}.dalan_sync_log (source, status, details, created_at)
        VALUES (%s, %s, %s, NOW())
    """, (source, status, details))

def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "status")

    conn = get_conn()
    cur = conn.cursor()

    if action == "status":
        gateway_enabled = get_gateway_enabled(cur)
        gateway_url = get_gateway_url(cur)
        pc_online = False
        if gateway_enabled and gateway_url:
            pc_online = ping_gateway(gateway_url)

        auto_source = "pc" if pc_online else "cloud"
        config = get_dalan_config(cur)

        conn.close()
        return {"statusCode": 200, "headers": headers, "body": json.dumps({
            "gateway_enabled": gateway_enabled,
            "gateway_url": gateway_url,
            "pc_online": pc_online,
            "auto_source": auto_source,
            "dalan_config": config,
            "sync_time": datetime.utcnow().isoformat()
        })}

    if action == "sync":
        gateway_enabled = get_gateway_enabled(cur)
        gateway_url = get_gateway_url(cur)
        pc_online = False
        pc_config = None

        if gateway_enabled and gateway_url:
            pc_online = ping_gateway(gateway_url)

        if pc_online:
            try:
                req = urllib.request.Request(
                    f"{gateway_url.rstrip('/')}/dalan/config",
                    method="GET"
                )
                resp = urllib.request.urlopen(req, timeout=10)
                pc_config = json.loads(resp.read().decode())
            except Exception as e:
                pc_online = False

        source = "pc" if pc_online and pc_config else "cloud"

        if source == "pc" and pc_config:
            for key, value in pc_config.items():
                cur.execute(f"""
                    UPDATE {SCHEMA}.dalan_config
                    SET param_value = %s, updated_at = NOW()
                    WHERE param_key = %s
                """, (str(value), key))
            log_sync(cur, "pc", "success", f"updated {len(pc_config)} params")
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({
                "ok": True,
                "source": "pc",
                "updated": len(pc_config),
                "message": f"Синхронизировано с ПК: {len(pc_config)} параметров"
            })}
        else:
            config = get_dalan_config(cur)
            log_sync(cur, "cloud", "success", "loaded from cloud DB")
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({
                "ok": True,
                "source": "cloud",
                "config": config,
                "message": "ПК недоступен — используется облачная конфигурация"
            })}

    if action == "save_config":
        body = json.loads(event.get("body") or "{}")
        key = body.get("key")
        value = body.get("value")
        if not key:
            conn.close()
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "key required"})}
        cur.execute(f"""
            UPDATE {SCHEMA}.dalan_config SET param_value = %s, updated_at = NOW()
            WHERE param_key = %s
        """, (str(value), key))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "unknown action"})}