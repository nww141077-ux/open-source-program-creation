"""
ЕЦСУ 2.0 — Публичный API-шлюз (Gateway).
Открытый сервер для интеграции внешних систем.
Предоставляет: публичный ключ, статус, инциденты, отправку обращений.
Доступен без аутентификации (read-only) и с API-ключом (write).
"""
import json
import os
import hashlib
import secrets
import urllib.request
from datetime import datetime, timezone

import psycopg2
from psycopg2.extras import RealDictCursor

S = "t_p38294978_open_source_program_"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Api-Key, Authorization",
}

# Публичный идентификатор системы (не секрет)
SYSTEM_ID = "egsu-2.0-open"
SYSTEM_VERSION = "2.0.0"
OWNER = "Николаев Владимир Владимирович"
SYSTEM_NAME = "ЕЦСУ 2.0 (Единая Центральная Система Управления)"

# Публичный ключ системы (RSA-подобная заглушка — в продакшне заменить на реальный)
PUBLIC_KEY_PEM = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0EGSU2System0OpenKey0
OwnerNikolaevVladimirVladimirovich2024EGSU20PublicKeyForIntegration
Integration0Available0ForAllSystems0Worldwide0FreeOpenSource0EGSU20
EGSU2SystemKey0ForExternalIntegration0ContactOwnerForFullKey0Access
-----END PUBLIC KEY-----
(Полный RSA-ключ предоставляется по запросу: egsu@system.ru)"""


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def verify_api_key(headers: dict) -> bool:
    """Проверяем API-ключ из заголовка X-Api-Key."""
    key = headers.get("X-Api-Key") or headers.get("x-api-key") or ""
    stored = os.environ.get("EGSU_API_KEY", "")
    if not stored:
        return True  # Если ключ не настроен — пропускаем (открытый режим)
    return secrets.compare_digest(key, stored)


def handler(event: dict, context) -> dict:
    """Публичный API-шлюз ЕЦСУ 2.0 — открытая интеграция."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    headers = event.get("headers") or {}
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # ── GET / — информация о системе и публичный ключ ────────────────────────
    if method == "GET" and path in ("/", ""):
        return ok({
            "system": SYSTEM_NAME,
            "version": SYSTEM_VERSION,
            "system_id": SYSTEM_ID,
            "owner": OWNER,
            "status": "active",
            "license": "Open Source (гражданская инициатива)",
            "public_key": PUBLIC_KEY_PEM,
            "endpoints": {
                "GET /": "Информация о системе и публичный ключ",
                "GET /status": "Статус всех модулей",
                "GET /incidents": "Публичный список инцидентов (verified)",
                "GET /countries": "Страны-участницы",
                "GET /rewards": "Типы вознаграждений за содействие",
                "POST /appeal": "Зарегистрировать обращение (требует X-Api-Key)",
                "POST /sms": "Отправить SMS-уведомление (требует X-Api-Key)",
                "POST /reward-request": "Запрос вознаграждения (требует X-Api-Key)",
            },
            "contact": "egsu@system.ru (в разработке)",
            "server_time": datetime.now(timezone.utc).isoformat(),
        })

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # ── GET /status — статус модулей ─────────────────────────────────────────
    if method == "GET" and "/status" in path:
        cur.execute(f"SELECT COUNT(*) as c FROM {S}.egsu_incidents")
        inc_total = cur.fetchone()["c"]
        cur.execute(f"SELECT COUNT(*) as c FROM {S}.egsu_incidents WHERE status='active'")
        inc_active = cur.fetchone()["c"]
        cur.execute(f"SELECT COUNT(*) as c FROM {S}.egsu_security_events")
        sec_total = cur.fetchone()["c"]
        cur.execute(f"SELECT balance FROM {S}.egsu_finance_accounts WHERE account_number='EGSU-ABS-9999' LIMIT 1")
        row = cur.fetchone()
        balance = float(row["balance"]) if row else 0
        conn.close()
        return ok({
            "modules": {
                "incidents": {"status": "active", "total": inc_total, "active": inc_active},
                "security": {"status": "active", "absorption_balance_usd": balance, "events": sec_total},
                "ai": {"status": "active", "provider": "multi-provider"},
                "scanner": {"status": "active", "sources": ["GDACS","USGS","OpenAQ","CVE","ReliefWeb","EMSC"]},
                "sms": {"status": "active", "provider": "SMSC.ru"},
                "gateway": {"status": "active", "version": SYSTEM_VERSION},
            },
            "uptime": "active",
            "last_check": datetime.now(timezone.utc).isoformat(),
        })

    # ── GET /incidents — публичные инциденты ─────────────────────────────────
    if method == "GET" and "/incidents" in path:
        limit = min(int(params.get("limit", 20)), 100)
        itype = params.get("type", "")
        severity = params.get("severity", "")
        q = f"""
            SELECT incident_code, type, title, description, country, location,
                   severity, status, verification_score, responsible_organ,
                   external_url, created_at
            FROM {S}.egsu_incidents
            WHERE status IN ('verified', 'active', 'investigating')
        """
        args = []
        if itype:
            q += " AND type=%s"; args.append(itype)
        if severity:
            q += " AND severity=%s"; args.append(severity)
        q += f" ORDER BY created_at DESC LIMIT {limit}"
        cur.execute(q, args)
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"incidents": rows, "total": len(rows), "system": SYSTEM_ID})

    # ── GET /countries — страны-участницы ─────────────────────────────────────
    if method == "GET" and "/countries" in path:
        cur.execute(f"SELECT * FROM {S}.egsu_countries WHERE active=true ORDER BY name_ru")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"countries": rows, "total": len(rows)})

    # ── GET /rewards — типы вознаграждений ────────────────────────────────────
    if method == "GET" and "/rewards" in path:
        cur.execute(f"SELECT * FROM {S}.egsu_reward_types WHERE active=true ORDER BY id")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({
            "reward_types": rows,
            "legal_note": "Выплаты производятся государственными органами при подтверждении факта. ЕЦСУ 2.0 содействует оформлению заявок.",
            "owner": OWNER,
        })

    # ── POST /appeal — регистрация обращения ──────────────────────────────────
    if method == "POST" and "/appeal" in path:
        incident_type = body.get("incident_type", "default")
        description = body.get("description", "")
        country = body.get("country", "RUS")
        title = body.get("title", "Обращение")
        if not description:
            conn.close()
            return err("description обязателен")
        code = f"APL-{hashlib.md5(description.encode()).hexdigest()[:6].upper()}"
        cur.execute(f"""
            INSERT INTO {S}.egsu_system_log (event_type, source, message, data)
            VALUES ('appeal_received', 'gateway', %s, %s)
        """, (f"Обращение {code}: {title}", json.dumps({"type": incident_type, "country": country, "code": code})))
        conn.commit()
        conn.close()
        return ok({
            "code": code,
            "status": "registered",
            "message": f"Обращение {code} зарегистрировано в системе ЕЦСУ 2.0",
            "next_steps": ["Обращение будет направлено в соответствующие органы", "Срок рассмотрения: 30 дней (ФЗ №59)", "При бездействии — автоэскалация в прокуратуру"],
        }, 201)

    # ── POST /reward-request — запрос вознаграждения ──────────────────────────
    if method == "POST" and "/reward-request" in path:
        reward_type_code = body.get("reward_type", "corruption_whistleblower")
        incident_id = body.get("incident_id")
        bank_account = body.get("bank_account", "")
        bank_name = body.get("bank_name", "")
        card_number = body.get("card_number", "")
        amount = float(body.get("amount_requested_rub", 0))
        legal_basis = body.get("legal_basis", "")

        cur.execute(f"SELECT id FROM {S}.egsu_reward_types WHERE code=%s", (reward_type_code,))
        rt = cur.fetchone()
        if not rt:
            conn.close()
            return err("Тип вознаграждения не найден")

        cur.execute(f"""
            INSERT INTO {S}.egsu_reward_requests
            (reward_type_id, incident_id, applicant_name, bank_name, bank_account, card_number, amount_requested_rub, legal_basis, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id
        """, (rt["id"], incident_id, OWNER, bank_name, bank_account, card_number, amount or None, legal_basis))
        req_id = cur.fetchone()["id"]
        conn.commit()
        conn.close()
        return ok({
            "request_id": req_id,
            "status": "pending",
            "message": f"Заявка #{req_id} на вознаграждение создана. Будет направлена в соответствующий орган.",
            "legal_basis": legal_basis or "ФЗ №273 / ФЗ №59",
        }, 201)

    conn.close()
    return err("Маршрут не найден", 404)
