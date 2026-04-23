"""
Гражданские иски ECSU 2.0 — модуль подачи и обработки исков граждан.
Позволяет подавать иски по нарушениям, автоматически рассчитывает штраф
по типу нарушения и начисляет его на счёт Absorption Fund (id=5).
Поддерживает фильтрацию по статусу, обновление статуса и resolution_notes.
"""
import json
import os
from datetime import datetime

import psycopg2
from psycopg2.extras import RealDictCursor

S = "t_p38294978_open_source_program_"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    "Content-Type": "application/json",
}

# Штрафные тарифы по типу нарушения (в рублях)
PENALTY_MAP = {
    "unauthorized_actions": 50000,
    "data_theft":           100000,
    "environmental":        75000,
    "harassment":           30000,
    "fraud":                80000,
    "rights_violation":     40000,
}
DEFAULT_PENALTY = 25000

# id счёта Absorption Fund
ABSORPTION_ACCOUNT_ID = 5


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, code=200):
    return {
        "statusCode": code,
        "headers": CORS,
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def err(msg, code=400):
    return {
        "statusCode": code,
        "headers": CORS,
        "body": json.dumps({"error": msg}, ensure_ascii=False),
    }


def esc(val):
    """Экранирование строки для Simple Query Protocol (без %s)."""
    if val is None:
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"


def extract_id(path: str):
    """Извлекает числовой ID из последнего сегмента пути."""
    parts = path.rstrip("/").split("/")
    try:
        return int(parts[-1])
    except (ValueError, IndexError):
        return None


def handler(event: dict, context) -> dict:
    """
    Обработчик гражданских исков ECSU 2.0.

    GET /                — список всех исков, сортировка по дате создания DESC
    GET /?status=new     — фильтрация исков по статусу (new/review/accepted/rejected/paid)
    POST /               — подать новый иск; обязательны: claimant_name, violation_type,
                           violation_description. Автоматически рассчитывается штраф
                           по типу нарушения и начисляется на счёт Absorption Fund (id=5).
    PUT /{id}            — обновить статус иска и/или resolution_notes
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    claim_id = extract_id(path)

    # ── POST раньше GET, чтобы claim_id не мешал роутингу ────────────────────

    # ── POST / — подать иск ───────────────────────────────────────────────────
    if method == "POST" and not claim_id:
        body = json.loads(event.get("body") or "{}")

        claimant_name        = (body.get("claimant_name") or "").strip()
        violation_type       = (body.get("violation_type") or "").strip()
        violation_description = (body.get("violation_description") or "").strip()

        if not claimant_name:
            return err("Поле claimant_name обязательно")
        if not violation_type:
            return err("Поле violation_type обязательно")
        if not violation_description:
            return err("Поле violation_description обязательно")

        claimant_email       = body.get("claimant_email") or None
        claimant_phone       = body.get("claimant_phone") or None
        legal_basis          = body.get("legal_basis") or None
        claimed_amount       = body.get("claimed_amount") or None
        evidence_description = body.get("evidence_description") or None
        incident_id          = body.get("incident_id") or None

        # Автоматический расчёт штрафа
        penalty_charged = float(PENALTY_MAP.get(violation_type, DEFAULT_PENALTY))

        # Числовые поля
        claimed_amount_sql = str(float(claimed_amount)) if claimed_amount is not None else "NULL"
        incident_id_sql    = str(int(incident_id)) if incident_id is not None else "NULL"
        now = datetime.now().isoformat()

        db = get_db()
        cur = db.cursor(cursor_factory=RealDictCursor)

        cur.execute(f"""
            INSERT INTO {S}.egsu_civil_claims
                (claimant_name, claimant_email, claimant_phone,
                 violation_type, violation_description,
                 legal_basis, claimed_amount, evidence_description,
                 incident_id, status, penalty_charged,
                 absorption_account_id, created_at, updated_at)
            VALUES (
                {esc(claimant_name)},
                {esc(claimant_email)},
                {esc(claimant_phone)},
                {esc(violation_type)},
                {esc(violation_description)},
                {esc(legal_basis)},
                {claimed_amount_sql},
                {esc(evidence_description)},
                {incident_id_sql},
                'new',
                {penalty_charged},
                {ABSORPTION_ACCOUNT_ID},
                '{now}',
                '{now}'
            )
            RETURNING *
        """)
        row = dict(cur.fetchone())

        # Начислить штраф на счёт Absorption Fund
        cur.execute(f"""
            UPDATE {S}.egsu_finance_accounts
            SET balance = balance + {penalty_charged},
                updated_at = '{now}'
            WHERE id = {ABSORPTION_ACCOUNT_ID}
        """)

        db.commit()
        db.close()

        row["penalty_charged"] = float(row.get("penalty_charged") or penalty_charged)
        return ok({
            **row,
            "message": (
                f"Иск принят. Штраф {penalty_charged:,.0f} ₽ начислен на счёт "
                f"Absorption Fund (id={ABSORPTION_ACCOUNT_ID})."
            ),
        }, 201)

    # ── GET / — список исков ──────────────────────────────────────────────────
    if method == "GET" and not claim_id:
        status_filter = params.get("status", "")
        db = get_db()
        cur = db.cursor(cursor_factory=RealDictCursor)

        if status_filter:
            cur.execute(f"""
                SELECT * FROM {S}.egsu_civil_claims
                WHERE status = {esc(status_filter)}
                ORDER BY created_at DESC
            """)
        else:
            cur.execute(f"""
                SELECT * FROM {S}.egsu_civil_claims
                ORDER BY created_at DESC
            """)

        rows = [dict(r) for r in cur.fetchall()]
        db.close()

        # Приводим numeric к float для JSON
        for r in rows:
            for f in ("claimed_amount", "penalty_charged"):
                if r.get(f) is not None:
                    r[f] = float(r[f])

        return ok(rows)

    # ── PUT /{id} — обновить статус / notes ───────────────────────────────────
    if method == "PUT" and claim_id:
        body = json.loads(event.get("body") or "{}")
        if not body:
            return err("Тело запроса пустое")

        allowed = {"status", "resolution_notes"}
        set_parts = []
        for key in allowed:
            if key not in body:
                continue
            set_parts.append(f"{key} = {esc(body[key])}")

        if not set_parts:
            return err("Нет допустимых полей для обновления (status, resolution_notes)")

        now = datetime.now().isoformat()
        set_parts.append(f"updated_at = '{now}'")
        set_clause = ", ".join(set_parts)

        db = get_db()
        cur = db.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"""
            UPDATE {S}.egsu_civil_claims
            SET {set_clause}
            WHERE id = {claim_id}
            RETURNING *
        """)
        row = cur.fetchone()
        db.commit()
        db.close()

        if not row:
            return err("Иск не найден", 404)

        row = dict(row)
        for f in ("claimed_amount", "penalty_charged"):
            if row.get(f) is not None:
                row[f] = float(row[f])

        return ok(row)

    return err("Маршрут не найден", 404)
