"""
Модуль безопасности ЕЦСУ 2.0 — Режим Поглощения.
Фиксирует несанкционированные входы, кибератаки, попытки копирования данных.
Автоматически начисляет штрафные суммы на счёт Absorption Mode Fund.
"""
import json
import os
import psycopg2
from datetime import datetime

S = "t_p38294978_open_source_program_"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, X-Real-IP",
}

# Штрафные тарифы по типу атаки (USD)
PENALTY_RATES = {
    "unauthorized_access": 500,
    "cyber_attack": 2500,
    "brute_force": 750,
    "data_scraping": 250,
    "ddos": 5000,
    "sql_injection": 1000,
    "xss_attempt": 300,
    "port_scan": 100,
    "api_abuse": 200,
    "unauthorized_copy": 1500,
}

SEVERITY_MAP = {
    "unauthorized_access": "high",
    "cyber_attack": "critical",
    "brute_force": "high",
    "data_scraping": "medium",
    "ddos": "critical",
    "sql_injection": "critical",
    "xss_attempt": "medium",
    "port_scan": "low",
    "api_abuse": "medium",
    "unauthorized_copy": "high",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_absorption_account_id(cur):
    cur.execute(f"SELECT id FROM {S}.egsu_finance_accounts WHERE account_number='EGSU-ABS-9999' LIMIT 1")
    row = cur.fetchone()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    headers = event.get("headers") or {}
    client_ip = headers.get("X-Real-IP") or headers.get("x-forwarded-for", "unknown")

    db = get_conn()
    cur = db.cursor()

    # ── GET / — статус режима поглощения ─────────────────────────────────────
    if method == "GET" and (path.endswith("/security") or path == "/"):
        abs_id = get_absorption_account_id(cur)

        cur.execute(f"SELECT balance FROM {S}.egsu_finance_accounts WHERE id=%s", (abs_id,))
        row = cur.fetchone()
        balance = float(row[0]) if row else 0

        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events")
        total_events = cur.fetchone()[0]

        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events WHERE is_blocked=true")
        blocked_count = cur.fetchone()[0]

        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events WHERE severity='critical'")
        critical_count = cur.fetchone()[0]

        cur.execute(f"SELECT COALESCE(SUM(penalty_amount),0) FROM {S}.egsu_security_events")
        total_penalties = float(cur.fetchone()[0])

        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_blocked_ips")
        blocked_ips = cur.fetchone()[0]

        cur.execute(f"""
            SELECT event_type, COUNT(*) as cnt
            FROM {S}.egsu_security_events
            GROUP BY event_type ORDER BY cnt DESC LIMIT 5
        """)
        top_events = [{"event_type": r[0], "count": r[1]} for r in cur.fetchall()]

        return ok({
            "mode": "ABSORPTION_ACTIVE",
            "absorption_balance_usd": balance,
            "total_events": total_events,
            "blocked_threats": blocked_count,
            "critical_events": critical_count,
            "total_penalties_usd": total_penalties,
            "blocked_ips_count": blocked_ips,
            "top_attack_types": top_events,
            "protection_level": "MAXIMUM",
        })

    # ── GET /events — лог событий ─────────────────────────────────────────────
    if method == "GET" and "/events" in path:
        severity = params.get("severity")
        limit = min(int(params.get("limit", 50)), 200)
        q = f"""
            SELECT id, event_type, severity, ip_address, user_agent,
                   endpoint, description, penalty_amount, is_blocked,
                   geo_country, created_at
            FROM {S}.egsu_security_events
        """
        if severity:
            q += f" WHERE severity='{severity}'"
        q += f" ORDER BY created_at DESC LIMIT {limit}"
        cur.execute(q)
        cols = ["id","event_type","severity","ip_address","user_agent","endpoint",
                "description","penalty_amount","is_blocked","geo_country","created_at"]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        for r in rows:
            r["penalty_amount"] = float(r["penalty_amount"])
        return ok(rows)

    # ── GET /blocked — список заблокированных IP ──────────────────────────────
    if method == "GET" and "/blocked" in path:
        cur.execute(f"""
            SELECT id, ip_address, reason, blocked_at, expires_at, is_permanent
            FROM {S}.egsu_blocked_ips ORDER BY blocked_at DESC
        """)
        cols = ["id","ip_address","reason","blocked_at","expires_at","is_permanent"]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        return ok(rows)

    # ── POST /report — зафиксировать атаку и начислить штраф ─────────────────
    if method == "POST" and "/report" in path:
        event_type = body.get("event_type", "unauthorized_access")
        ip = body.get("ip_address", client_ip)
        user_agent = body.get("user_agent", headers.get("user-agent", ""))
        endpoint = body.get("endpoint", "")
        description = body.get("description", "")
        geo_country = body.get("geo_country", "")
        custom_penalty = body.get("penalty_amount")

        penalty = float(custom_penalty) if custom_penalty else float(PENALTY_RATES.get(event_type, 100))
        severity = SEVERITY_MAP.get(event_type, "medium")
        abs_id = get_absorption_account_id(cur)

        # Проверяем повторный IP
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events WHERE ip_address=%s", (ip,))
        repeat_count = cur.fetchone()[0]
        if repeat_count > 0:
            penalty = penalty * 1.5  # +50% за повторную атаку
        if repeat_count > 3:
            penalty = penalty * 2    # x2 за серийные атаки

        # Записываем событие
        cur.execute(f"""
            INSERT INTO {S}.egsu_security_events
              (event_type, severity, ip_address, user_agent, endpoint, description,
               penalty_amount, absorption_account_id, is_blocked, geo_country)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (event_type, severity, ip, user_agent, endpoint, description,
              penalty, abs_id, True, geo_country))
        event_id = cur.fetchone()[0]

        # Начисляем на счёт поглощения
        if abs_id:
            cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=balance+%s, updated_at=NOW() WHERE id=%s", (penalty, abs_id))
            cur.execute(f"""
                INSERT INTO {S}.egsu_finance_transactions
                  (account_id, tx_type, amount, currency, description, source, status)
                VALUES (%s,'income',%s,'USD',%s,%s,'completed')
            """, (abs_id, penalty, f"Absorption: {event_type} from {ip}", "EGSU Security Module"))

        # Автоблокировка IP
        cur.execute(f"""
            INSERT INTO {S}.egsu_blocked_ips (ip_address, reason, is_permanent)
            VALUES (%s,%s,%s)
            ON CONFLICT (ip_address) DO UPDATE SET reason=EXCLUDED.reason
        """, (ip, f"Auto-blocked: {event_type}", repeat_count > 3))

        db.commit()
        return ok({
            "event_id": event_id,
            "penalty_charged_usd": penalty,
            "ip_blocked": True,
            "repeat_offender": repeat_count > 0,
            "message": f"Атака зафиксирована. Штраф ${penalty:.0f} USD начислен на счёт Absorption Mode Fund.",
        }, 201)

    # ── POST /manual — ручная фиксация нарушения ──────────────────────────────
    if method == "POST" and "/manual" in path:
        description = body.get("description", "")
        amount = float(body.get("amount", 0))
        event_type = body.get("event_type", "unauthorized_access")
        ip = body.get("ip_address", "manual")
        if amount <= 0:
            return err("amount > 0 обязателен")
        abs_id = get_absorption_account_id(cur)
        cur.execute(f"""
            INSERT INTO {S}.egsu_security_events
              (event_type, severity, ip_address, description, penalty_amount, absorption_account_id, is_blocked)
            VALUES (%s,'high',%s,%s,%s,%s,false) RETURNING id
        """, (event_type, ip, description, amount, abs_id))
        event_id = cur.fetchone()[0]
        if abs_id:
            cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=balance+%s, updated_at=NOW() WHERE id=%s", (amount, abs_id))
            cur.execute(f"""
                INSERT INTO {S}.egsu_finance_transactions
                  (account_id, tx_type, amount, currency, description, source, status)
                VALUES (%s,'income',%s,'USD',%s,'Manual Entry','completed')
            """, (abs_id, amount, description))
        db.commit()
        return ok({"event_id": event_id, "message": f"Зачислено ${amount:.2f} USD на счёт Поглощения"}, 201)

    return err("Маршрут не найден", 404)
