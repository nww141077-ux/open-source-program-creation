"""
Финансовый модуль ЕЦСУ: счета, карты, транзакции, правила распределения.
Владелец: Николаев В.В.
"""
import json, os, psycopg2

SCHEMA = "t_p38294978_open_source_program_"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def resp(status, data):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        raw = event["body"]
        body = json.loads(raw) if isinstance(raw, str) else raw

    db = conn()
    cur = db.cursor()

    # GET / — stats
    if method == "GET" and path in ("/", ""):
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.egsu_finance_accounts WHERE is_active = true")
        acc_count = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.egsu_finance_cards WHERE is_active = true")
        card_count = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(amount), 0) FROM {SCHEMA}.egsu_finance_transactions WHERE tx_type = 'income'")
        income = float(cur.fetchone()[0])
        cur.execute(f"SELECT COALESCE(SUM(amount), 0) FROM {SCHEMA}.egsu_finance_transactions WHERE tx_type = 'outcome'")
        outcome = float(cur.fetchone()[0])
        db.close()
        return resp(200, {"accounts": acc_count, "cards": card_count, "total_income_usd": income, "total_outcome_usd": outcome})

    # GET /accounts
    if method == "GET" and path.endswith("/accounts"):
        cur.execute(f"""
            SELECT a.id, a.owner_name, a.account_type, a.account_number, a.bank_name,
                   a.currency, a.label, a.is_active, a.is_primary, a.distribution_percent,
                   COALESCE(a.balance, 0) as balance, a.created_at,
                   COUNT(c.id) as cards_count
            FROM {SCHEMA}.egsu_finance_accounts a
            LEFT JOIN {SCHEMA}.egsu_finance_cards c ON c.account_id = a.id AND c.is_active = true
            WHERE a.is_active = true
            GROUP BY a.id ORDER BY a.is_primary DESC, a.created_at ASC
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        db.close()
        return resp(200, rows)

    # POST /accounts
    if method == "POST" and path.endswith("/accounts"):
        cur.execute(f"""
            INSERT INTO {SCHEMA}.egsu_finance_accounts
              (owner_name, account_type, account_number, bank_name, currency, label, distribution_percent)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            body.get("owner_name", ""), body.get("account_type", "bank"),
            body.get("account_number", ""), body.get("bank_name", ""),
            body.get("currency", "RUB"), body.get("label", ""),
            body.get("distribution_percent", 0)
        ))
        new_id = cur.fetchone()[0]
        db.commit(); db.close()
        return resp(200, {"id": new_id})

    # GET /cards
    if method == "GET" and path.endswith("/cards"):
        cur.execute(f"""
            SELECT c.id, c.account_id, c.card_holder, c.card_last4, c.card_type,
                   c.expiry_month, c.expiry_year, c.is_active, c.created_at,
                   COALESCE(a.label, a.owner_name) as account_label, a.bank_name
            FROM {SCHEMA}.egsu_finance_cards c
            JOIN {SCHEMA}.egsu_finance_accounts a ON a.id = c.account_id
            WHERE c.is_active = true ORDER BY c.created_at DESC
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        db.close()
        return resp(200, rows)

    # POST /cards
    if method == "POST" and path.endswith("/cards"):
        cur.execute(f"""
            INSERT INTO {SCHEMA}.egsu_finance_cards
              (account_id, card_holder, card_last4, card_type, expiry_month, expiry_year)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            body.get("account_id"), body.get("card_holder", ""),
            body.get("card_last4", ""), body.get("card_type", "visa"),
            body.get("expiry_month"), body.get("expiry_year")
        ))
        new_id = cur.fetchone()[0]
        db.commit(); db.close()
        return resp(200, {"id": new_id})

    # GET /transactions
    if method == "GET" and path.endswith("/transactions"):
        cur.execute(f"""
            SELECT t.id, t.account_id, t.tx_type, t.amount, t.currency,
                   t.description, t.source, t.status, t.created_at,
                   COALESCE(a.label, a.owner_name) as account_label
            FROM {SCHEMA}.egsu_finance_transactions t
            JOIN {SCHEMA}.egsu_finance_accounts a ON a.id = t.account_id
            ORDER BY t.created_at DESC LIMIT 100
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        db.close()
        return resp(200, rows)

    # POST /transactions
    if method == "POST" and path.endswith("/transactions"):
        cur.execute(f"""
            INSERT INTO {SCHEMA}.egsu_finance_transactions
              (account_id, tx_type, amount, currency, description, source)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            body.get("account_id"), body.get("tx_type", "income"),
            body.get("amount", 0), body.get("currency", "RUB"),
            body.get("description", ""), body.get("source", "")
        ))
        new_id = cur.fetchone()[0]
        db.commit(); db.close()
        return resp(200, {"id": new_id})

    # GET /rules
    if method == "GET" and path.endswith("/rules"):
        cur.execute(f"""
            SELECT r.id, r.name, r.account_id, r.percent, r.description, r.is_active,
                   COALESCE(a.label, a.owner_name) as account_label, a.currency
            FROM {SCHEMA}.egsu_finance_rules r
            JOIN {SCHEMA}.egsu_finance_accounts a ON a.id = r.account_id
            ORDER BY r.percent DESC
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        db.close()
        return resp(200, rows)

    # POST /rules
    if method == "POST" and path.endswith("/rules"):
        cur.execute(f"""
            INSERT INTO {SCHEMA}.egsu_finance_rules (name, account_id, percent, description)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (
            body.get("name", ""), body.get("account_id"),
            body.get("percent", 0), body.get("description", "")
        ))
        new_id = cur.fetchone()[0]
        db.commit(); db.close()
        return resp(200, {"id": new_id})

    db.close()
    return resp(404, {"error": "Not found"})
