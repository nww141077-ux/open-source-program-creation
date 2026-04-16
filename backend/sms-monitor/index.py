"""
ЕЦСУ 2.0 — SMS-рассылка + ИИ-мониторинг бездействия ведомств.
SMS через SMSC.ru (бесплатный тестовый режим).
Мониторинг: если ведомство не ответило за 30 дней → автоэскалация в прокуратуру.
При признаках коррупции → немедленный штраф + отчёт.
"""
import json
import os
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta

import psycopg2
from psycopg2.extras import RealDictCursor

S = "t_p38294978_open_source_program_"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

OWNER_NAME = "Николаев Владимир Владимирович"
OWNER_SYSTEM = "ЕЦСУ 2.0"

# Реальные номера ведомств для SMS (WhatsApp/Telegram-каналы)
AGENCY_PHONES = {
    "mchs": "+74957274444",
    "mvd": "+74953320211",
    "prosecutor": "+74952522555",
    "fsb": "+74952243838",
    "rosprirodnadzor": "+74992524900",
}

# Надзорные органы для эскалации
OVERSIGHT_AGENCIES = [
    {"id": "prosecutor_general", "name": "Генеральная прокуратура РФ", "email": "genproc@genproc.gov.ru", "phone": "88002507755"},
    {"id": "presidential_admin", "name": "Администрация Президента РФ", "email": "letters@kremlin.ru", "phone": "84957804543"},
    {"id": "human_rights", "name": "Уполномоченный по правам человека", "email": "ombudsman@rop.ru", "phone": "84999009501"},
]

AI_API = "https://functions.poehali.dev/daefa87e-0693-4de5-9191-bbc918e1d241"
SECURITY_API = "https://functions.poehali.dev/15640332-461b-47d1-b024-8fa25fb344ef"


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def send_sms(phone: str, message: str, sender: str = "EGSU") -> dict:
    """Отправка SMS через SMSC.ru."""
    login = os.environ.get("SMSC_LOGIN", "")
    password = os.environ.get("SMSC_PASSWORD", "")

    if not login or not password:
        return {"status": "no_credentials", "message": "SMSC не настроен. Зарегистрируйтесь на smsc.ru"}

    # Ограничение SMS до 160 символов
    sms_text = message[:160]

    params = urllib.parse.urlencode({
        "login": login,
        "psw": password,
        "phones": phone,
        "mes": sms_text,
        "sender": sender[:11],
        "fmt": "3",  # JSON
        "charset": "utf-8",
    })
    url = f"https://smsc.ru/sys/send.php?{params}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "EGSU/2.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            result = json.loads(r.read())
        return {"status": "sent", "smsc_response": result}
    except Exception as e:
        return {"status": "error", "error": str(e)}


def call_ai(prompt: str) -> str:
    """Вызов ИИ-администратора для анализа."""
    try:
        data = json.dumps({
            "message": prompt,
            "session_id": f"monitor_{datetime.now().timestamp()}",
            "history": [],
            "provider": "auto"
        }).encode()
        req = urllib.request.Request(AI_API, data=data, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=25) as r:
            result = json.loads(r.read())
        parsed = json.loads(result) if isinstance(result, str) else result
        return parsed.get("reply", "")
    except Exception:
        return ""


def detect_corruption_signs(inaction_days: int, agency_name: str, incident_type: str) -> dict:
    """Определяем признаки коррупции и халатности."""
    signs = []
    corruption_likely = False
    penalty_rub = 0
    legal_basis = []

    if inaction_days > 30:
        signs.append(f"Нарушение ФЗ №59: срок рассмотрения превышен на {inaction_days - 30} дней")
        penalty_rub += 10000
        legal_basis.append("КоАП РФ ст. 5.59 — штраф 5000–10000 руб.")

    if inaction_days > 60:
        signs.append("Систематическое бездействие — признак халатности")
        penalty_rub += 50000
        legal_basis.append("УК РФ ст. 293 — халатность (штраф до 120 000 руб. или лишение свободы)")

    if inaction_days > 90:
        corruption_likely = True
        signs.append("Длительное бездействие — возможен умысел (коррупция)")
        penalty_rub += 200000
        legal_basis.append("УК РФ ст. 285 — злоупотребление должностными полномочиями")
        legal_basis.append("ФЗ №273 «О противодействии коррупции» ст. 13")

    if incident_type in ("cyber_attack", "system_block") and inaction_days > 7:
        corruption_likely = True
        signs.append("Бездействие при кибератаке — нарушение Доктрины информационной безопасности")
        penalty_rub += 100000
        legal_basis.append("УК РФ ст. 274 + Доктрина ИБ РФ (Указ №646)")

    return {
        "corruption_likely": corruption_likely,
        "signs": signs,
        "penalty_rub": penalty_rub,
        "legal_basis": legal_basis,
        "severity": "critical" if corruption_likely else ("high" if inaction_days > 60 else "medium"),
    }


def handler(event: dict, context) -> dict:
    """SMS-рассылка и ИИ-мониторинг бездействия ведомств ЕЦСУ."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # ── GET / — статус SMS и мониторинга ─────────────────────────────────────
    if method == "GET":
        cur.execute(f"SELECT COUNT(*) as c FROM {S}.egsu_sms_log")
        sms_total = cur.fetchone()["c"]
        cur.execute(f"SELECT COUNT(*) as c FROM {S}.egsu_inaction_monitor WHERE inaction_detected=true")
        inactions = cur.fetchone()["c"]
        cur.execute(f"SELECT COUNT(*) as c FROM {S}.egsu_inaction_monitor WHERE corruption_suspected=true")
        corruptions = cur.fetchone()["c"]
        conn.close()
        return ok({
            "sms_sent": sms_total,
            "inactions_detected": inactions,
            "corruption_cases": corruptions,
            "smsc_configured": bool(os.environ.get("SMSC_LOGIN")),
            "oversight_agencies": OVERSIGHT_AGENCIES,
        })

    # ── POST /sms — отправить SMS ─────────────────────────────────────────────
    if method == "POST" and "/sms" in path:
        phones = body.get("phones", [])
        message = body.get("message", "")
        agency = body.get("agency", "")
        if not phones or not message:
            conn.close()
            return err("phones и message обязательны")
        if isinstance(phones, str):
            phones = [phones]

        results = []
        for phone in phones[:10]:  # Максимум 10 за раз
            result = send_sms(phone, message)
            status = result.get("status", "unknown")
            cur.execute(f"""
                INSERT INTO {S}.egsu_sms_log (phone, message, agency, status, provider)
                VALUES (%s, %s, %s, %s, 'smsc')
            """, (phone, message[:500], agency, status))
            results.append({"phone": phone[-4:] + "****", "status": status})

        conn.commit()
        conn.close()
        return ok({"sent": len(results), "results": results})

    # ── POST /notify-agencies — SMS + email уведомление ведомствам ───────────
    if method == "POST" and "/notify-agencies" in path:
        incident_id = body.get("incident_id")
        agency_ids = body.get("agency_ids", [])
        message_text = body.get("message", "")
        incident_type = body.get("incident_type", "default")

        if not message_text:
            conn.close()
            return err("message обязателен")

        # SMS ведомствам (если есть номера)
        sms_results = []
        for aid in agency_ids:
            phone = AGENCY_PHONES.get(aid)
            if phone:
                sms_msg = f"ЕЦСУ 2.0 | {message_text[:120]}"
                result = send_sms(phone, sms_msg)
                sms_results.append({"agency": aid, "status": result.get("status")})
                cur.execute(f"""
                    INSERT INTO {S}.egsu_sms_log (phone, message, agency, status)
                    VALUES (%s, %s, %s, %s)
                """, (phone, sms_msg, aid, result.get("status", "unknown")))

        # Регистрируем мониторинг ожидания ответа
        monitor_ids = []
        for aid in agency_ids:
            deadline = datetime.now(timezone.utc) + timedelta(days=30)
            cur.execute(f"""
                INSERT INTO {S}.egsu_inaction_monitor
                (incident_id, agency_id, agency_name, appeal_sent_at, deadline_at)
                VALUES (%s, %s, %s, NOW(), %s)
                RETURNING id
            """, (incident_id, aid, aid, deadline))
            monitor_ids.append(cur.fetchone()["id"])

        conn.commit()
        conn.close()
        return ok({
            "sms_results": sms_results,
            "monitor_ids": monitor_ids,
            "deadline": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "message": f"Уведомления отправлены. Мониторинг бездействия активирован на 30 дней.",
        })

    # ── POST /check-inaction — проверить бездействие + ИИ-анализ ────────────
    if method == "POST" and "/check-inaction" in path:
        monitor_id = body.get("monitor_id")
        agency_id = body.get("agency_id", "")
        incident_id = body.get("incident_id")
        incident_type = body.get("incident_type", "default")
        agency_name = body.get("agency_name", "Ведомство")

        # Вычисляем срок ожидания
        if monitor_id:
            cur.execute(f"SELECT * FROM {S}.egsu_inaction_monitor WHERE id=%s", (monitor_id,))
            monitor = cur.fetchone()
        else:
            monitor = None

        sent_at = monitor["appeal_sent_at"] if monitor else datetime.now(timezone.utc) - timedelta(days=35)
        inaction_days = (datetime.now(timezone.utc) - sent_at.replace(tzinfo=timezone.utc)).days if sent_at else 35

        # Анализ признаков коррупции
        analysis = detect_corruption_signs(inaction_days, agency_name, incident_type)

        # ИИ-анализ ситуации
        ai_prompt = f"""[СИСТЕМНАЯ ЗАДАЧА — ИИ АДМИНИСТРАТОР ЕЦСУ]
Проанализируй бездействие ведомства и составь официальный отчёт.

Ведомство: {agency_name}
Дней без ответа: {inaction_days}
Тип инцидента: {incident_type}
Признаки коррупции: {analysis['corruption_likely']}
Выявленные нарушения: {'; '.join(analysis['signs'])}
Правовые основания: {'; '.join(analysis['legal_basis'])}

Составь:
1. Официальный отчёт о бездействии (3-4 предложения)
2. Рекомендации по наказанию с указанием конкретных статей
3. Список надзорных органов куда направить
4. Если есть признаки коррупции — немедленные меры

Стиль: официально-деловой, от имени системы ЕЦСУ 2.0, автор — {OWNER_NAME}."""

        ai_analysis = call_ai(ai_prompt)

        # Формируем отчёт для надзорных органов
        escalation_report = f"""ОТЧЁТ О БЕЗДЕЙСТВИИ ДОЛЖНОСТНЫХ ЛИЦ
Система: ЕЦСУ 2.0 | Автор: {OWNER_NAME}
Дата: {datetime.now(timezone.utc).strftime('%d.%m.%Y')}

Ведомство: {agency_name}
Дней без ответа: {inaction_days} (норма: 30 по ФЗ №59)

ВЫЯВЛЕННЫЕ НАРУШЕНИЯ:
{chr(10).join('• ' + s for s in analysis['signs'])}

ПРАВОВЫЕ ОСНОВАНИЯ ДЛЯ ПРИВЛЕЧЕНИЯ К ОТВЕТСТВЕННОСТИ:
{chr(10).join('• ' + l for l in analysis['legal_basis'])}

РЕКОМЕНДУЕМЫЕ МЕРЫ:
• Штраф: {analysis['penalty_rub']:,.0f} руб.
{'• НЕМЕДЛЕННОЕ возбуждение дела по признакам коррупции (ФЗ №273)' if analysis['corruption_likely'] else ''}
• Направить предписание об устранении нарушения
• Проверка должностных лиц на предмет злоупотреблений

ИИ-АНАЛИЗ:
{ai_analysis[:800] if ai_analysis else 'Анализ выполнен системой ЕЦСУ 2.0'}

С уважением,
{OWNER_NAME}
{OWNER_SYSTEM}"""

        # Обновляем запись мониторинга
        inaction_detected = inaction_days > 30
        if monitor_id:
            cur.execute(f"""
                UPDATE {S}.egsu_inaction_monitor
                SET inaction_detected=%s, corruption_suspected=%s,
                    ai_analysis=%s, ai_recommendation=%s,
                    penalty_recommended_rub=%s
                WHERE id=%s
            """, (inaction_detected, analysis["corruption_likely"],
                  ai_analysis[:2000] if ai_analysis else "", escalation_report[:2000],
                  analysis["penalty_rub"], monitor_id))

        # Если коррупция — немедленно начисляем штраф через security
        if analysis["corruption_likely"] and inaction_days > 30:
            try:
                sec_data = json.dumps({
                    "event_type": "unauthorized_copy",  # Злоупотребление = unauthorized
                    "ip_address": f"inaction_{agency_id}",
                    "description": f"Коррупционное бездействие: {agency_name}, {inaction_days} дней",
                    "penalty_amount": min(analysis["penalty_rub"] / 70, 5000),  # Конвертируем в USD
                }).encode()
                req = urllib.request.Request(f"{SECURITY_API}/report", data=sec_data, headers={"Content-Type": "application/json"}, method="POST")
                urllib.request.urlopen(req, timeout=10)
            except Exception:
                pass

        # SMS в надзорные органы (если коррупция)
        sms_sent = []
        if analysis["corruption_likely"]:
            for oversight in OVERSIGHT_AGENCIES[:2]:
                phone = oversight["phone"]
                sms_msg = f"ЕЦСУ: Коррупция в {agency_name[:30]}. {inaction_days} дней бездействия. {OWNER_NAME}"
                result = send_sms(phone, sms_msg)
                sms_sent.append({"agency": oversight["name"], "status": result.get("status")})
                cur.execute(f"""
                    INSERT INTO {S}.egsu_sms_log (phone, message, agency, status)
                    VALUES (%s, %s, %s, %s)
                """, (phone, sms_msg, oversight["id"], result.get("status", "unknown")))
                if monitor_id:
                    cur.execute(f"""
                        UPDATE {S}.egsu_inaction_monitor
                        SET escalation_sent=true, escalation_to=%s, escalation_at=NOW()
                        WHERE id=%s
                    """, (oversight["name"], monitor_id))

        conn.commit()
        conn.close()
        return ok({
            "inaction_detected": inaction_detected,
            "inaction_days": inaction_days,
            "corruption_suspected": analysis["corruption_likely"],
            "analysis": analysis,
            "escalation_report": escalation_report,
            "ai_analysis": ai_analysis[:500] if ai_analysis else "",
            "sms_to_oversight": sms_sent,
            "penalty_recommended_rub": analysis["penalty_rub"],
        })

    # ── POST /reward-sms — SMS уведомление о вознаграждении ─────────────────
    if method == "POST" and "/reward-sms" in path:
        phone = body.get("phone", "")
        reward_type = body.get("reward_type", "")
        amount = body.get("amount", 0)
        if not phone:
            conn.close()
            return err("phone обязателен")
        msg = f"ЕЦСУ: Ваш запрос на вознаграждение ({reward_type}) {amount} руб. зарегистрирован. Ответ в течение 30 дней."
        result = send_sms(phone, msg)
        cur.execute(f"INSERT INTO {S}.egsu_sms_log (phone, message, agency, status) VALUES (%s, %s, 'reward', %s)",
                    (phone, msg, result.get("status", "unknown")))
        conn.commit()
        conn.close()
        return ok(result)

    conn.close()
    return err("Маршрут не найден", 404)
