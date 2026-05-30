"""
Режим Поглощения ЕЦСУ 2.0: безопасность, штрафы, блок-лист, выводы.
Владелец: Николаев В.В.
"""
import json, os, psycopg2

S = "t_p38294978_open_source_program_"
ABSORPTION_ACCOUNT_ID = 5
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

PENALTY_RATES = {
    "unauthorized_access": 500, "cyber_attack": 2500, "brute_force": 750,
    "data_scraping": 250, "ddos": 5000, "sql_injection": 1000,
    "xss_attempt": 300, "port_scan": 100, "api_abuse": 200, "unauthorized_copy": 1500,
}

SEV_MAP = {"ddos": "critical", "cyber_attack": "critical", "sql_injection": "high",
           "unauthorized_access": "high", "brute_force": "high", "unauthorized_copy": "medium",
           "xss_attempt": "medium", "data_scraping": "medium", "api_abuse": "low", "port_scan": "low"}

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

    # GET / — stats
    if method == "GET" and path in ("/", ""):
        cur.execute(f"SELECT COALESCE(balance, 0) FROM {S}.egsu_finance_accounts WHERE id = {ABSORPTION_ACCOUNT_ID}")
        row = cur.fetchone()
        abs_balance = float(row[0]) if row else 0.0

        cur.execute(f"SELECT COUNT(*), COUNT(*) FILTER (WHERE is_blocked), COUNT(*) FILTER (WHERE severity='critical'), COALESCE(SUM(penalty_amount),0) FROM {S}.egsu_security_events")
        r = cur.fetchone()
        total, blocked_threats, critical, total_penalties = r[0], r[1], r[2], float(r[3])

        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_blocked_ips")
        blocked_ips = cur.fetchone()[0]

        cur.execute(f"SELECT event_type, COUNT(*) as cnt FROM {S}.egsu_security_events GROUP BY event_type ORDER BY cnt DESC LIMIT 5")
        top = [{"event_type": r[0], "count": r[1]} for r in cur.fetchall()]

        con.close()
        return resp(200, {
            "mode": "absorption", "absorption_balance_usd": abs_balance,
            "total_events": total, "blocked_threats": blocked_threats,
            "critical_events": critical, "total_penalties_usd": total_penalties,
            "blocked_ips_count": blocked_ips, "top_attack_types": top,
            "protection_level": "maximum",
        })

    # GET /events
    if method == "GET" and path.endswith("/events"):
        cur.execute(f"""
            SELECT id, event_type, severity, ip_address, user_agent, endpoint,
                   description, penalty_amount, is_blocked, geo_country, created_at
            FROM {S}.egsu_security_events ORDER BY created_at DESC LIMIT 100
        """)
        con.close()
        return resp(200, rows(cur))

    # GET /blocked
    if method == "GET" and path.endswith("/blocked"):
        cur.execute(f"SELECT id, ip_address, reason, blocked_at, is_permanent FROM {S}.egsu_blocked_ips ORDER BY blocked_at DESC")
        con.close()
        return resp(200, rows(cur))

    # POST /report — зафиксировать атаку
    if method == "POST" and path.endswith("/report"):
        etype = body.get("event_type", "cyber_attack")
        ip = body.get("ip_address", "unknown")
        desc = body.get("description", "")
        endpoint = body.get("endpoint", "")
        geo = body.get("geo_country", "")

        # подсчёт повторов с этого IP
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events WHERE ip_address = %s", (ip,))
        repeat_count = cur.fetchone()[0]
        base_rate = PENALTY_RATES.get(etype, 500)
        if repeat_count >= 3:
            penalty = base_rate * 2
        elif repeat_count >= 1:
            penalty = int(base_rate * 1.5)
        else:
            penalty = base_rate

        severity = SEV_MAP.get(etype, "medium")
        is_blocked = severity in ("critical", "high")

        cur.execute(f"""
            INSERT INTO {S}.egsu_security_events
              (event_type, severity, ip_address, endpoint, description, penalty_amount, absorption_account_id, is_blocked, geo_country)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (etype, severity, ip, endpoint, desc, penalty, ABSORPTION_ACCOUNT_ID, is_blocked, geo))

        if is_blocked and ip != "unknown":
            cur.execute(f"""
                INSERT INTO {S}.egsu_blocked_ips (ip_address, reason, is_permanent)
                VALUES (%s, %s, %s) ON CONFLICT DO NOTHING
            """, (ip, f"Автоблок: {etype} — {desc[:100]}", severity == "critical"))

        # зачислить на счёт поглощения
        cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance = COALESCE(balance,0) + %s WHERE id = %s", (penalty, ABSORPTION_ACCOUNT_ID))
        con.commit(); con.close()

        return resp(200, {
            "message": f"Атака зафиксирована. Штраф {penalty} USD зачислен на счёт поглощения.",
            "penalty_charged_usd": penalty,
            "blocked": is_blocked,
        })

    # POST /manual — ручное начисление
    if method == "POST" and path.endswith("/manual"):
        etype = body.get("event_type", "unauthorized_access")
        ip = body.get("ip_address", "manual")
        desc = body.get("description", "")
        amount = float(body.get("amount", PENALTY_RATES.get(etype, 500)))

        cur.execute(f"""
            INSERT INTO {S}.egsu_security_events
              (event_type, severity, ip_address, description, penalty_amount, absorption_account_id, is_blocked)
            VALUES (%s, %s, %s, %s, %s, %s, false) RETURNING id
        """, (etype, SEV_MAP.get(etype, "medium"), ip, desc, amount, ABSORPTION_ACCOUNT_ID))

        cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance = COALESCE(balance,0) + %s WHERE id = %s", (amount, ABSORPTION_ACCOUNT_ID))
        con.commit(); con.close()

        return resp(200, {"message": f"Штраф {amount} USD зачислен вручную на счёт поглощения."})

    con.close()
    return resp(404, {"error": "Not found"})
