"""
Панель владельца ЕЦСУ 2.0: профиль, настройки, журнал доступа, восстановление.
Владелец: Николаев Владимир Владимирович.
"""
import json, os, secrets, psycopg2

S = "t_p38294978_open_source_program_"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def resp(status, data):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}

def rows(cur):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        raw = event["body"]
        body = json.loads(raw) if isinstance(raw, str) else raw

    con = db()
    cur = con.cursor()

    # GET /owner — профиль + статистика
    if method == "GET" and path.endswith("/owner"):
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_notifications WHERE is_read = false")
        unread = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events WHERE created_at > now() - interval '24 hours'")
        threats = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_finance_transactions WHERE created_at > now() - interval '24 hours'")
        txs = cur.fetchone()[0]
        cur.execute(f"""
            SELECT action, ip_address as ip, created_at as at
            FROM {S}.egsu_access_log ORDER BY created_at DESC LIMIT 5
        """)
        last_access = rows(cur)
        con.close()
        return resp(200, {
            "owner_name": "Николаев Владимир Владимирович",
            "system_name": "ЕЦСУ 2.0",
            "stats": {"unread_notifications": unread, "threats_today": threats, "transactions_today": txs},
            "last_access": last_access,
        })

    # GET /owner/settings
    if method == "GET" and path.endswith("/owner/settings"):
        cur.execute(f"""
            SELECT setting_key as key, setting_value as value, setting_type as type,
                   description, updated_at FROM {S}.egsu_owner_settings ORDER BY id
        """)
        con.close()
        return resp(200, rows(cur))

    # PUT /owner/settings
    if method == "PUT" and path.endswith("/owner/settings"):
        key = body.get("key", "")
        value = body.get("value", "")
        cur.execute(f"""
            UPDATE {S}.egsu_owner_settings
            SET setting_value = %s, updated_at = now()
            WHERE setting_key = %s
        """, (value, key))
        con.commit(); con.close()
        return resp(200, {"ok": True})

    # GET /owner/access-log
    if method == "GET" and path.endswith("/owner/access-log"):
        cur.execute(f"""
            SELECT id, action, ip_address as ip, user_agent as ua, created_at as at
            FROM {S}.egsu_access_log ORDER BY created_at DESC LIMIT 50
        """)
        con.close()
        return resp(200, rows(cur))

    # POST /recovery
    if method == "POST" and path.endswith("/recovery"):
        reason = body.get("reason", "")
        token = secrets.token_hex(8)
        cur.execute(f"""
            INSERT INTO {S}.egsu_access_log (action, ip_address, details)
            VALUES (%s, %s, %s)
        """, (f"RECOVERY REQUEST: {reason}", "system", json.dumps({"token_prefix": token[:4]})))
        con.commit(); con.close()
        return resp(200, {
            "message": "Запрос на восстановление доступа зафиксирован. Администратор системы свяжется с вами в течение 24 часов.",
            "token_prefix": token[:4],
        })

    con.close()
    return resp(404, {"error": "Not found"})
