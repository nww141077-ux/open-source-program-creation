"""
Модуль безопасности ЕЦСУ 2.0 — Режим Поглощения v2.
Фиксирует несанкционированные вторжения, блокировки системы, кибератаки.
Определяет источник угрозы через эфир/спектр анализ.
Накладывает штраф на владельца канала/IP.
Синхронизируется с ЦПВОА.
"""
import json
import os
import urllib.request
import urllib.error
import ipaddress
import hashlib
from datetime import datetime, timezone

import psycopg2
from psycopg2.extras import RealDictCursor

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
    "system_block": 10000,       # Блокировка системы — максимальный штраф
    "spectrum_intrusion": 3000,  # Вторжение через эфир/спектр
    "channel_hijack": 7500,      # Захват канала
    "mesh_intrusion": 2000,      # Вторжение через меш-сеть
    "radio_jamming": 4000,       # Радиопомехи
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
    "system_block": "critical",
    "spectrum_intrusion": "critical",
    "channel_hijack": "critical",
    "mesh_intrusion": "high",
    "radio_jamming": "high",
}

# Открытые API для геолокации и ASN (бесплатные)
IPINFO_URL = "https://ipinfo.io/{ip}/json"
IPAPI_URL = "https://ip-api.com/json/{ip}?fields=status,country,regionName,city,isp,org,as,query"

# Частотные диапазоны эфира (спектр)
SPECTRUM_BANDS = {
    "fm_radio": {"range": "88-108 МГц", "type": "FM радиовещание"},
    "am_radio": {"range": "530-1700 кГц", "type": "AM радиовещание"},
    "wifi_24": {"range": "2.4 ГГц", "type": "WiFi 802.11b/g/n"},
    "wifi_5": {"range": "5 ГГц", "type": "WiFi 802.11ac/ax"},
    "lte": {"range": "700-2600 МГц", "type": "LTE/4G"},
    "satellite": {"range": "1.2-30 ГГц", "type": "Спутниковый канал"},
    "mesh": {"range": "915 МГц / 2.4 ГГц", "type": "Меш-сеть ЦПВОА"},
    "bluetooth": {"range": "2.4 ГГц", "type": "Bluetooth"},
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_absorption_account_id(cur):
    cur.execute(f"SELECT id FROM {S}.egsu_finance_accounts WHERE account_number='EGSU-ABS-9999' LIMIT 1")
    row = cur.fetchone()
    if not row:
        return None
    return row["id"] if isinstance(row, dict) else row[0]


def geo_lookup(ip: str) -> dict:
    """Геолокация и информация об ASN/провайдере IP."""
    result = {"ip": ip, "country": "Unknown", "city": "Unknown", "isp": "Unknown", "org": "Unknown", "asn": "Unknown"}
    try:
        # Пробуем ip-api (бесплатный, без ключа)
        url = IPAPI_URL.format(ip=ip)
        req = urllib.request.Request(url, headers={"User-Agent": "EGSU-Security/2.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read())
        if data.get("status") == "success":
            result.update({
                "country": data.get("country", "Unknown"),
                "city": f"{data.get('city','')}, {data.get('regionName','')}".strip(", "),
                "isp": data.get("isp", "Unknown"),
                "org": data.get("org", "Unknown"),
                "asn": data.get("as", "Unknown"),
            })
    except Exception:
        pass
    return result


def analyze_spectrum_source(spectrum_band: str, signal_strength: float, freq_mhz: float) -> dict:
    """Анализ источника вторжения по спектру/эфиру."""
    band_info = SPECTRUM_BANDS.get(spectrum_band, {"range": f"{freq_mhz} МГц", "type": "Неизвестный диапазон"})
    threat_level = "low"
    if signal_strength > 80:
        threat_level = "critical"
    elif signal_strength > 60:
        threat_level = "high"
    elif signal_strength > 40:
        threat_level = "medium"

    # Определяем характер вторжения
    intrusion_type = "passive_monitoring"
    if signal_strength > 70:
        intrusion_type = "active_jamming"
    elif signal_strength > 50:
        intrusion_type = "signal_injection"
    elif signal_strength > 30:
        intrusion_type = "channel_scanning"

    return {
        "band": spectrum_band,
        "band_info": band_info,
        "freq_mhz": freq_mhz,
        "signal_strength_db": signal_strength,
        "threat_level": threat_level,
        "intrusion_type": intrusion_type,
        "channel_owner_liability": True,
        "legal_basis": "Закон о связи РФ, ст. 24; МСЭ Radio Regulations, Art. 15",
    }


def calculate_channel_penalty(geo: dict, spectrum: dict | None, event_type: str, repeat: int) -> dict:
    """Рассчитываем штраф с учётом канала и спектра."""
    base = float(PENALTY_RATES.get(event_type, 500))

    # Повторные атаки
    if repeat > 0:
        base *= 1.5
    if repeat > 3:
        base *= 2.0
    if repeat > 10:
        base *= 3.0

    # Спектральная надбавка
    spectrum_penalty = 0.0
    if spectrum:
        if spectrum["threat_level"] == "critical":
            spectrum_penalty = base * 0.5
        elif spectrum["threat_level"] == "high":
            spectrum_penalty = base * 0.3

    total = base + spectrum_penalty

    # Кто несёт ответственность
    channel_owner = geo.get("isp", "Unknown ISP")
    asn = geo.get("asn", "Unknown ASN")

    return {
        "base_penalty_usd": round(base, 2),
        "spectrum_penalty_usd": round(spectrum_penalty, 2),
        "total_penalty_usd": round(total, 2),
        "responsible_channel": channel_owner,
        "asn": asn,
        "country": geo.get("country", "Unknown"),
        "legal_action": "штраф наложен на владельца канала" if total > 1000 else "предупреждение",
    }


def record_event_and_charge(cur, event_type: str, ip: str, description: str,
                              penalty: float, severity: str, abs_id: int,
                              geo: dict = None, spectrum: dict = None,
                              endpoint: str = "", user_agent: str = "", geo_country: str = "") -> int:
    """Записываем событие и начисляем штраф."""
    country = (geo or {}).get("country", geo_country or "")
    cur.execute(f"""
        INSERT INTO {S}.egsu_security_events
          (event_type, severity, ip_address, user_agent, endpoint, description,
           penalty_amount, absorption_account_id, is_blocked, geo_country)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (event_type, severity, ip, user_agent, endpoint, description,
          penalty, abs_id, True, country))
    event_id = cur.fetchone()[0]

    # Начисляем на счёт поглощения
    if abs_id:
        cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=balance+%s, updated_at=NOW() WHERE id=%s", (penalty, abs_id))
        cur.execute(f"""
            INSERT INTO {S}.egsu_finance_transactions
              (account_id, tx_type, amount, currency, description, source, status)
            VALUES (%s,'income',%s,'USD',%s,%s,'completed')
        """, (abs_id, penalty,
              f"Absorption [{event_type}] from {ip} ({country})",
              f"EGSU Security · Channel: {(geo or {}).get('isp', 'Unknown')}"))

    # Автоблокировка
    cur.execute(f"""
        INSERT INTO {S}.egsu_blocked_ips (ip_address, reason, is_permanent)
        VALUES (%s,%s,%s)
        ON CONFLICT (ip_address) DO UPDATE SET reason=EXCLUDED.reason, blocked_at=NOW()
    """, (ip, f"Auto-blocked: {event_type} | {(geo or {}).get('isp','')}", True if event_type == "system_block" else False))

    # Лог в system_log
    try:
        cur.execute(f"""
            INSERT INTO {S}.egsu_system_log (event_type, source, message, data)
            VALUES ('security_event', 'security-module', %s, %s)
        """, (f"[{severity.upper()}] {event_type} от {ip}", json.dumps({"geo": geo, "spectrum": spectrum, "penalty": penalty}, default=str)))
    except Exception:
        pass

    return event_id


def handler(event: dict, context) -> dict:
    """Модуль безопасности ЕЦСУ — Режим Поглощения v2."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    headers = event.get("headers") or {}
    client_ip = headers.get("X-Real-IP") or headers.get("x-forwarded-for", "unknown")

    db = get_db()
    cur = db.cursor(cursor_factory=RealDictCursor)

    # ── GET / — статус режима поглощения ─────────────────────────────────────
    if method == "GET" and (path.endswith("/security") or path == "/"):
        abs_id = get_absorption_account_id(cur)
        cur.execute(f"SELECT balance FROM {S}.egsu_finance_accounts WHERE id=%s", (abs_id,))
        row = cur.fetchone()
        balance = float(row["balance"]) if row else 0.0

        cur.execute(f"SELECT COUNT(*) as c FROM {S}.egsu_security_events")
        total_events = cur.fetchone()["c"]
        cur.execute(f"SELECT COUNT(*) as c FROM {S}.egsu_security_events WHERE is_blocked=true")
        blocked_count = cur.fetchone()["c"]
        cur.execute(f"SELECT COUNT(*) as c FROM {S}.egsu_security_events WHERE severity='critical'")
        critical_count = cur.fetchone()["c"]
        cur.execute(f"SELECT COALESCE(SUM(penalty_amount),0) as s FROM {S}.egsu_security_events")
        total_penalties = float(cur.fetchone()["s"])
        cur.execute(f"SELECT COUNT(*) as c FROM {S}.egsu_blocked_ips")
        blocked_ips = cur.fetchone()["c"]
        cur.execute(f"""
            SELECT event_type, COUNT(*) as cnt FROM {S}.egsu_security_events
            GROUP BY event_type ORDER BY cnt DESC LIMIT 5
        """)
        top_events = [{"event_type": r["event_type"], "count": r["cnt"]} for r in cur.fetchall()]

        # Последние события (последние 5 для ЦПВОА)
        cur.execute(f"""
            SELECT event_type, severity, ip_address, geo_country, penalty_amount, created_at
            FROM {S}.egsu_security_events ORDER BY created_at DESC LIMIT 5
        """)
        last_5 = [dict(r) for r in cur.fetchall()]

        db.close()
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
            "last_events": last_5,
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
        args = []
        if severity:
            q += " WHERE severity=%s"
            args.append(severity)
        q += f" ORDER BY created_at DESC LIMIT {limit}"
        cur.execute(q, args)
        rows = [dict(r) for r in cur.fetchall()]
        for r in rows:
            r["penalty_amount"] = float(r["penalty_amount"])
        db.close()
        return ok(rows)

    # ── GET /blocked — список заблокированных IP ──────────────────────────────
    if method == "GET" and "/blocked" in path:
        cur.execute(f"""
            SELECT id, ip_address, reason, blocked_at, expires_at, is_permanent
            FROM {S}.egsu_blocked_ips ORDER BY blocked_at DESC
        """)
        db.close()
        return ok([dict(r) for r in cur.fetchall()])

    # ── POST /report — зафиксировать атаку ──────────────────────────────��────
    if method == "POST" and "/report" in path:
        event_type = body.get("event_type", "unauthorized_access")
        ip = body.get("ip_address", client_ip)
        user_agent = body.get("user_agent", headers.get("user-agent", ""))
        endpoint = body.get("endpoint", "")
        description = body.get("description", "")
        geo_country = body.get("geo_country", "")
        custom_penalty = body.get("penalty_amount")

        # Геолокация
        geo = geo_lookup(ip) if ip and ip != "unknown" else {}

        # Повторность
        cur2 = db.cursor()
        cur2.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events WHERE ip_address=%s", (ip,))
        repeat_count = cur2.fetchone()[0]

        # Штраф
        base = float(custom_penalty) if custom_penalty else float(PENALTY_RATES.get(event_type, 100))
        if repeat_count > 0:
            base *= 1.5
        if repeat_count > 3:
            base *= 2.0
        severity = SEVERITY_MAP.get(event_type, "medium")
        abs_id = get_absorption_account_id(cur2)

        event_id = record_event_and_charge(
            cur2, event_type, ip, description, base, severity, abs_id,
            geo=geo, endpoint=endpoint, user_agent=user_agent, geo_country=geo_country
        )
        db.commit()
        db.close()
        return ok({
            "event_id": event_id,
            "penalty_charged_usd": round(base, 2),
            "ip_blocked": True,
            "repeat_offender": repeat_count > 0,
            "geo": geo,
            "responsible_channel": geo.get("isp", "Unknown"),
            "asn": geo.get("asn", "Unknown"),
            "message": f"Атака зафиксирована. Штраф ${base:.0f} USD начислен. Канал: {geo.get('isp','Unknown')}",
        }, 201)

    # ── POST /intrusion — детектирование вторжения через эфир/спектр ─────────
    if method == "POST" and "/intrusion" in path:
        """Анализ вторжения через радиоэфир/спектр + синхронизация с режимом поглощения."""
        ip = body.get("ip_address", client_ip)
        spectrum_band = body.get("spectrum_band", "wifi_24")
        signal_strength = float(body.get("signal_strength_db", 50))
        freq_mhz = float(body.get("freq_mhz", 2400))
        source_type = body.get("source_type", "unknown")  # ip, radio, mesh, satellite
        description = body.get("description", "Вторжение обнаружено ЦПВОА")
        channel_id = body.get("channel_id", "")

        # Анализ спектра
        spectrum = analyze_spectrum_source(spectrum_band, signal_strength, freq_mhz)

        # Геолокация (если IP известен)
        geo = {}
        if ip and ip not in ("unknown", "radio", "mesh"):
            geo = geo_lookup(ip)

        # Расчёт штрафа
        event_type = "spectrum_intrusion"
        if source_type == "mesh":
            event_type = "mesh_intrusion"
        elif source_type == "radio" and signal_strength > 60:
            event_type = "radio_jamming"
        elif source_type == "channel":
            event_type = "channel_hijack"

        cur2 = db.cursor()
        cur2.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events WHERE ip_address=%s", (ip,))
        repeat_count = cur2.fetchone()[0]
        penalty_info = calculate_channel_penalty(geo, spectrum, event_type, repeat_count)
        total_penalty = penalty_info["total_penalty_usd"]
        severity = SEVERITY_MAP.get(event_type, "high")
        abs_id = get_absorption_account_id(cur2)

        full_desc = (
            f"{description}. "
            f"Диапазон: {spectrum['band_info']['range']} ({spectrum['band_info']['type']}). "
            f"Мощность: {signal_strength} дБ. "
            f"Тип вторжения: {spectrum['intrusion_type']}. "
            f"Канал: {geo.get('isp', 'Unknown')} / ASN: {geo.get('asn', 'Unknown')}"
        )

        event_id = record_event_and_charge(
            cur2, event_type, ip or f"radio_{channel_id}", full_desc,
            total_penalty, severity, abs_id, geo=geo, spectrum=spectrum
        )
        db.commit()
        db.close()

        return ok({
            "event_id": event_id,
            "intrusion_analysis": spectrum,
            "geo": geo,
            "penalty": penalty_info,
            "absorption_charged_usd": total_penalty,
            "legal_action": penalty_info["legal_action"],
            "legal_basis": spectrum["legal_basis"],
            "message": (
                f"Вторжение через {spectrum['band_info']['type']} зафиксировано. "
                f"Штраф ${total_penalty:.0f} USD наложен на {penalty_info['responsible_channel']}. "
                f"Основание: {spectrum['legal_basis']}"
            ),
            "cpvoa_sync": True,
            "absorption_sync": True,
        }, 201)

    # ── POST /block-response — реагирование на блокировку системы ────────────
    if method == "POST" and "/block-response" in path:
        """Ответ на несанкционированную блокировку ЕЦСУ."""
        blocker_ip = body.get("ip_address", client_ip)
        blocker_channel = body.get("channel", "unknown")
        block_type = body.get("block_type", "system_block")  # system_block, ddos, channel_hijack
        description = body.get("description", "Несанкционированная блокировка системы ЕЦСУ")

        geo = geo_lookup(blocker_ip) if blocker_ip and blocker_ip != "unknown" else {}

        cur2 = db.cursor()
        cur2.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events WHERE ip_address=%s", (blocker_ip,))
        repeat_count = cur2.fetchone()[0]

        # Максимальный штраф за блокировку
        penalty = float(PENALTY_RATES.get(block_type, 10000))
        if repeat_count > 0:
            penalty *= 2.0
        severity = "critical"
        abs_id = get_absorption_account_id(cur2)

        full_desc = (
            f"БЛОКИРОВКА СИСТЕМЫ: {description}. "
            f"Канал: {blocker_channel}. "
            f"Провайдер: {geo.get('isp', 'Unknown')}. "
            f"Страна: {geo.get('country', 'Unknown')}. "
            f"ASN: {geo.get('asn', 'Unknown')}."
        )

        event_id = record_event_and_charge(
            cur2, block_type, blocker_ip, full_desc,
            penalty, severity, abs_id, geo=geo
        )

        # Постоянная блокировка IP
        cur2.execute(f"""
            INSERT INTO {S}.egsu_blocked_ips (ip_address, reason, is_permanent)
            VALUES (%s, %s, true)
            ON CONFLICT (ip_address) DO UPDATE SET is_permanent=true, reason=EXCLUDED.reason
        """, (blocker_ip, f"PERMANENT: system_block | {geo.get('isp','')}"))

        db.commit()
        db.close()

        return ok({
            "event_id": event_id,
            "response": "ABSORPTION_MODE_ACTIVATED",
            "blocker_identified": {
                "ip": blocker_ip,
                "channel": blocker_channel,
                "isp": geo.get("isp", "Unknown"),
                "asn": geo.get("asn", "Unknown"),
                "country": geo.get("country", "Unknown"),
                "city": geo.get("city", "Unknown"),
            },
            "penalty_usd": penalty,
            "permanent_block": True,
            "legal_basis": "Закон о связи, ст. 63; УК РФ ст. 274; Будапештская конвенция",
            "message": (
                f"РЕЖИМ ПОГЛОЩЕНИЯ АКТИВИРОВАН. "
                f"Блокировщик идентифицирован: {geo.get('isp','Unknown')} ({geo.get('country','')}, {geo.get('asn','')}). "
                f"Штраф ${penalty:.0f} USD начислен. IP постоянно заблокирован."
            ),
        }, 201)

    # ── GET /scan-source — сканирование источника угрозы ─────────────────────
    if method == "GET" and "/scan-source" in path:
        ip = params.get("ip", "")
        if not ip:
            db.close()
            return err("ip обязателен")
        geo = geo_lookup(ip)

        cur2 = db.cursor()
        cur2.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events WHERE ip_address=%s", (ip,))
        event_count = cur2.fetchone()[0]
        cur2.execute(f"SELECT COALESCE(SUM(penalty_amount),0) FROM {S}.egsu_security_events WHERE ip_address=%s", (ip,))
        total_pen = float(cur2.fetchone()[0])
        cur2.execute(f"SELECT is_permanent FROM {S}.egsu_blocked_ips WHERE ip_address=%s LIMIT 1", (ip,))
        blocked_row = cur2.fetchone()

        db.close()
        return ok({
            "ip": ip,
            "geo": geo,
            "threat_history": {
                "total_events": event_count,
                "total_penalties_usd": total_pen,
                "is_blocked": blocked_row is not None,
                "is_permanent": blocked_row[0] if blocked_row else False,
            },
            "risk_level": "critical" if event_count > 5 else "high" if event_count > 2 else "medium" if event_count > 0 else "low",
            "spectrum_bands": SPECTRUM_BANDS,
        })

    # ── POST /manual — ручная фиксация ────────────────────────────────────────
    if method == "POST" and "/manual" in path:
        description = body.get("description", "")
        amount = float(body.get("amount", 0))
        event_type = body.get("event_type", "unauthorized_access")
        ip = body.get("ip_address", "manual")
        if amount <= 0:
            db.close()
            return err("amount > 0 обязателен")
        cur2 = db.cursor()
        abs_id = get_absorption_account_id(cur2)
        cur2.execute(f"""
            INSERT INTO {S}.egsu_security_events
              (event_type, severity, ip_address, description, penalty_amount, absorption_account_id, is_blocked)
            VALUES (%s,'high',%s,%s,%s,%s,false) RETURNING id
        """, (event_type, ip, description, amount, abs_id))
        event_id = cur2.fetchone()[0]
        if abs_id:
            cur2.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=balance+%s, updated_at=NOW() WHERE id=%s", (amount, abs_id))
            cur2.execute(f"""
                INSERT INTO {S}.egsu_finance_transactions
                  (account_id, tx_type, amount, currency, description, source, status)
                VALUES (%s,'income',%s,'USD',%s,'Manual Entry','completed')
            """, (abs_id, amount, description))
        db.commit()
        db.close()
        return ok({"event_id": event_id, "message": f"Зачислено ${amount:.2f} USD на счёт Поглощения"}, 201)

    db.close()
    return err("Маршрут не найден", 404)