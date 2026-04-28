"""
Финансовый модуль ECSU 2.0 — управление счетами, картами, транзакциями, правилами,
аналитикой, уведомлениями, профилем и настройками владельца.
"""
import json
import os
import hashlib
import psycopg2
from datetime import datetime

S = "t_p38294978_open_source_program_"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def rows(cur, cols):
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    db = conn()
    cur = db.cursor()

    # ── GET / — сводка ──────────────────────────────────────────────────────
    if method == "GET" and path.endswith("/finance") or (method == "GET" and path == "/"):
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_finance_accounts WHERE is_active=true")
        acc_count = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_finance_cards WHERE is_active=true")
        card_count = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {S}.egsu_finance_transactions WHERE tx_type='income' AND currency='USD'")
        total_in = float(cur.fetchone()[0])
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {S}.egsu_finance_transactions WHERE tx_type='outcome' AND currency='USD'")
        total_out = float(cur.fetchone()[0])
        return ok({"accounts": acc_count, "cards": card_count, "total_income_usd": total_in, "total_outcome_usd": total_out})

    # ── ACCOUNTS ─────────────────────────────────────────────────────────────

    if method == "GET" and "/accounts" in path and "/accounts/" not in path:
        cur.execute(f"""
            SELECT a.id, a.owner_name, a.account_type, a.account_number, a.bank_name,
                   a.currency, a.label, a.is_active, a.is_primary,
                   a.distribution_percent, a.balance, a.created_at,
                   COUNT(c.id) as cards_count
            FROM {S}.egsu_finance_accounts a
            LEFT JOIN {S}.egsu_finance_cards c ON c.account_id = a.id AND c.is_active = true
            WHERE a.is_active = true
              AND a.label NOT LIKE '[DEMO]%'
              AND a.account_number NOT IN ('EGSU-SYS-0001','EGSU-RSV-0002','EGSU-OPS-0003','EGSU-DEV-0004')
            GROUP BY a.id ORDER BY a.is_primary DESC, a.created_at
        """)
        cols = ["id","owner_name","account_type","account_number","bank_name",
                "currency","label","is_active","is_primary","distribution_percent","balance","created_at","cards_count"]
        return ok(rows(cur, cols))

    if method == "POST" and "/accounts" in path:
        name = body.get("owner_name","").strip()
        atype = body.get("account_type","bank")
        number = body.get("account_number","")
        bank = body.get("bank_name","")
        currency = body.get("currency","RUB")
        label = body.get("label","")
        dist = float(body.get("distribution_percent", 0))
        if not name:
            return err("owner_name обязателен")
        cur.execute(f"""
            INSERT INTO {S}.egsu_finance_accounts
              (owner_name, account_type, account_number, bank_name, currency, label, distribution_percent)
            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (name, atype, number, bank, currency, label, dist))
        new_id = cur.fetchone()[0]
        db.commit()
        return ok({"id": new_id, "message": "Счёт добавлен"}, 201)

    if method == "PUT" and "/accounts/" in path:
        acc_id = int(path.split("/accounts/")[1].split("/")[0])
        sets = []
        vals = []
        for field in ["owner_name","bank_name","label","currency","distribution_percent","is_primary","is_active","balance"]:
            if field in body:
                sets.append(f"{field}=%s")
                vals.append(body[field])
        if not sets:
            return err("Нет данных для обновления")
        vals.append(acc_id)
        cur.execute(f"UPDATE {S}.egsu_finance_accounts SET {', '.join(sets)}, updated_at=NOW() WHERE id=%s", vals)
        db.commit()
        return ok({"message": "Счёт обновлён"})

    # ── CARDS ─────────────────────────────────────────────────────────────────

    if method == "GET" and "/cards" in path and "/cards/" not in path:
        acc_id = params.get("account_id")
        q = f"""
            SELECT c.id, c.account_id, c.card_holder, c.card_last4, c.card_type,
                   c.expiry_month, c.expiry_year, c.is_active, c.created_at,
                   a.label as account_label, a.bank_name
            FROM {S}.egsu_finance_cards c
            JOIN {S}.egsu_finance_accounts a ON a.id = c.account_id
            WHERE c.is_active = true
        """
        if acc_id:
            q += f" AND c.account_id = {int(acc_id)}"
        q += " ORDER BY c.created_at DESC"
        cur.execute(q)
        cols = ["id","account_id","card_holder","card_last4","card_type","expiry_month","expiry_year","is_active","created_at","account_label","bank_name"]
        return ok(rows(cur, cols))

    if method == "POST" and "/cards" in path:
        acc_id = body.get("account_id")
        holder = body.get("card_holder","").strip()
        last4 = str(body.get("card_last4","")).strip()[-4:]
        ctype = body.get("card_type","visa")
        month = body.get("expiry_month")
        year = body.get("expiry_year")
        if not acc_id or not holder or len(last4) != 4:
            return err("account_id, card_holder и card_last4 (4 цифры) обязательны")
        cur.execute(f"""
            INSERT INTO {S}.egsu_finance_cards (account_id, card_holder, card_last4, card_type, expiry_month, expiry_year)
            VALUES (%s,%s,%s,%s,%s,%s) RETURNING id
        """, (int(acc_id), holder, last4, ctype, month, year))
        new_id = cur.fetchone()[0]
        db.commit()
        return ok({"id": new_id, "message": "Карта добавлена"}, 201)

    if method == "PUT" and "/cards/" in path:
        card_id = int(path.split("/cards/")[1].split("/")[0])
        sets, vals = [], []
        for field in ["card_holder","card_type","is_active"]:
            if field in body:
                sets.append(f"{field}=%s")
                vals.append(body[field])
        if not sets:
            return err("Нет данных")
        vals.append(card_id)
        cur.execute(f"UPDATE {S}.egsu_finance_cards SET {', '.join(sets)} WHERE id=%s", vals)
        db.commit()
        return ok({"message": "Карта обновлена"})

    # ── TRANSACTIONS ──────────────────────────────────────────────────────────

    if method == "GET" and "/transactions" in path:
        acc_id = params.get("account_id")
        limit = min(int(params.get("limit", 50)), 200)
        q = f"""
            SELECT t.id, t.account_id, t.tx_type, t.amount, t.currency,
                   t.description, t.source, t.status, t.created_at,
                   a.label as account_label
            FROM {S}.egsu_finance_transactions t
            JOIN {S}.egsu_finance_accounts a ON a.id = t.account_id
            WHERE t.status != 'demo_hidden'
              AND a.label NOT LIKE '[DEMO]%'
        """
        if acc_id:
            q += f" AND t.account_id = {int(acc_id)}"
        q += f" ORDER BY t.created_at DESC LIMIT {limit}"
        cur.execute(q)
        cols = ["id","account_id","tx_type","amount","currency","description","source","status","created_at","account_label"]
        return ok(rows(cur, cols))

    if method == "POST" and "/transactions" in path:
        acc_id = body.get("account_id")
        tx_type = body.get("tx_type","income")
        amount = float(body.get("amount", 0))
        currency = body.get("currency","RUB")
        desc = body.get("description","")
        source = body.get("source","")
        if not acc_id or amount <= 0:
            return err("account_id и amount > 0 обязательны")
        cur.execute(f"""
            INSERT INTO {S}.egsu_finance_transactions
              (account_id, tx_type, amount, currency, description, source)
            VALUES (%s,%s,%s,%s,%s,%s) RETURNING id
        """, (int(acc_id), tx_type, amount, currency, desc, source))
        new_id = cur.fetchone()[0]
        # Обновляем баланс
        if tx_type == "income":
            cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=balance+%s WHERE id=%s", (amount, int(acc_id)))
        elif tx_type == "outcome":
            cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=balance-%s WHERE id=%s", (amount, int(acc_id)))
        db.commit()
        return ok({"id": new_id, "message": "Транзакция записана"}, 201)

    # ── RULES ─────────────────────────────────────────────────────────────────

    if method == "GET" and "/rules" in path:
        cur.execute(f"""
            SELECT r.id, r.name, r.account_id, r.percent, r.description, r.is_active,
                   a.label as account_label, a.currency
            FROM {S}.egsu_finance_rules r
            JOIN {S}.egsu_finance_accounts a ON a.id = r.account_id
            ORDER BY r.percent DESC
        """)
        cols = ["id","name","account_id","percent","description","is_active","account_label","currency"]
        return ok(rows(cur, cols))

    if method == "POST" and "/rules" in path:
        name = body.get("name","").strip()
        acc_id = body.get("account_id")
        percent = float(body.get("percent", 0))
        desc = body.get("description","")
        if not name or not acc_id or percent <= 0:
            return err("name, account_id и percent обязательны")
        cur.execute(f"""
            INSERT INTO {S}.egsu_finance_rules (name, account_id, percent, description)
            VALUES (%s,%s,%s,%s) RETURNING id
        """, (name, int(acc_id), percent, desc))
        new_id = cur.fetchone()[0]
        db.commit()
        return ok({"id": new_id, "message": "Правило добавлено"}, 201)

    # ── WITHDRAWALS — вывод средств со счёта поглощения ──────────────────────

    if method == "GET" and "/withdrawals" in path:
        cur.execute(f"""
            SELECT w.id, w.from_account_id, w.to_account_id, w.to_account_details,
                   w.amount, w.currency, w.description, w.status,
                   w.confirmed_at, w.executed_at, w.created_at,
                   fa.label as from_label, fa.balance as from_balance,
                   ta.label as to_label, ta.account_number as to_number
            FROM {S}.egsu_withdrawal_requests w
            JOIN {S}.egsu_finance_accounts fa ON fa.id = w.from_account_id
            LEFT JOIN {S}.egsu_finance_accounts ta ON ta.id = w.to_account_id
            ORDER BY w.created_at DESC
        """)
        cols = ["id","from_account_id","to_account_id","to_account_details","amount","currency",
                "description","status","confirmed_at","executed_at","created_at",
                "from_label","from_balance","to_label","to_number"]
        result = rows(cur, cols)
        for r in result:
            r["amount"] = float(r["amount"]) if r["amount"] else 0
            r["from_balance"] = float(r["from_balance"]) if r["from_balance"] else 0
        return ok(result)

    if method == "POST" and "/withdrawals" in path and "/confirm" not in path and "/execute" not in path:
        from_id = body.get("from_account_id")
        to_id = body.get("to_account_id")
        to_details = body.get("to_account_details", {})
        amount = float(body.get("amount", 0))
        currency = body.get("currency", "USD")
        desc = body.get("description", "Вывод со счёта поглощения")
        if not from_id or amount <= 0:
            return err("from_account_id и amount > 0 обязательны")
        # Проверяем баланс
        cur.execute(f"SELECT balance FROM {S}.egsu_finance_accounts WHERE id=%s", (int(from_id),))
        row = cur.fetchone()
        if not row:
            return err("Счёт-источник не найден")
        balance = float(row[0])
        if amount > balance:
            return err(f"Недостаточно средств. Доступно: ${balance:.2f}")
        cur.execute(f"""
            INSERT INTO {S}.egsu_withdrawal_requests
              (from_account_id, to_account_id, to_account_details, amount, currency, description, status)
            VALUES (%s,%s,%s,%s,%s,%s,'pending') RETURNING id
        """, (int(from_id), int(to_id) if to_id else None,
              json.dumps(to_details), amount, currency, desc))
        new_id = cur.fetchone()[0]
        db.commit()
        return ok({"id": new_id, "status": "pending",
                   "message": f"Заявка на вывод ${amount:.2f} создана. Ожидает подтверждения."}, 201)

    if method == "POST" and "/withdrawals/" in path and "/confirm" in path:
        wid = int(path.split("/withdrawals/")[1].split("/")[0])
        cur.execute(f"""
            SELECT w.id, w.from_account_id, w.amount, w.status, w.to_account_id
            FROM {S}.egsu_withdrawal_requests w WHERE w.id=%s
        """, (wid,))
        row = cur.fetchone()
        if not row:
            return err("Заявка не найдена")
        if row[3] != "pending":
            return err(f"Заявка уже в статусе: {row[3]}")
        cur.execute(f"""
            UPDATE {S}.egsu_withdrawal_requests
            SET status='confirmed', confirmed_at=NOW() WHERE id=%s
        """, (wid,))
        db.commit()
        return ok({"message": "Заявка подтверждена. Готова к исполнению."})

    if method == "POST" and "/withdrawals/" in path and "/execute" in path:
        wid = int(path.split("/withdrawals/")[1].split("/")[0])
        cur.execute(f"""
            SELECT w.id, w.from_account_id, w.to_account_id, w.amount, w.currency, w.description, w.status
            FROM {S}.egsu_withdrawal_requests w WHERE w.id=%s
        """, (wid,))
        row = cur.fetchone()
        if not row:
            return err("Заявка не найдена")
        if row[6] != "confirmed":
            return err("Заявка должна быть подтверждена перед исполнением")
        wid_, from_id, to_id, amount, currency, desc, status = row
        amount = float(amount)
        # Проверяем баланс повторно
        cur.execute(f"SELECT balance FROM {S}.egsu_finance_accounts WHERE id=%s", (from_id,))
        bal_row = cur.fetchone()
        if not bal_row or float(bal_row[0]) < amount:
            return err("Недостаточно средств на счёте поглощения")
        # Списываем с absorption счёта
        cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=balance-%s, updated_at=NOW() WHERE id=%s",
                    (amount, from_id))
        # Если указан внутренний счёт-получатель — зачисляем
        if to_id:
            cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=balance+%s, updated_at=NOW() WHERE id=%s",
                        (amount, to_id))
            cur.execute(f"""
                INSERT INTO {S}.egsu_finance_transactions
                  (account_id, tx_type, amount, currency, description, source, status)
                VALUES (%s,'income',%s,%s,%s,'Absorption Withdrawal','completed')
            """, (to_id, amount, currency, desc))
        # Фиксируем расход на счёте поглощения
        cur.execute(f"""
            INSERT INTO {S}.egsu_finance_transactions
              (account_id, tx_type, amount, currency, description, source, status)
            VALUES (%s,'outcome',%s,%s,%s,'Withdrawal Execution','completed')
        """, (from_id, amount, currency, desc))
        # Закрываем заявку
        cur.execute(f"""
            UPDATE {S}.egsu_withdrawal_requests
            SET status='executed', executed_at=NOW() WHERE id=%s
        """, (wid,))
        db.commit()
        return ok({"message": f"Вывод ${amount:.2f} исполнен успешно.",
                   "amount": amount, "currency": currency})

    # ── POST /auto-withdraw — автоматический вывод штрафов на счёт владельца ──
    # Списывает весь баланс со счёта поглощения на указанный счёт или внешние реквизиты
    if method == "POST" and "/auto-withdraw" in path:
        to_id = body.get("to_account_id")           # внутренний счёт (необязательно)
        to_details = body.get("to_account_details", {})  # внешние реквизиты
        min_amount = float(body.get("min_amount", 1))    # минимальная сумма для вывода
        desc = body.get("description", "Авто-вывод штрафных начислений")

        # Получаем баланс счёта поглощения
        cur.execute(f"SELECT id, balance FROM {S}.egsu_finance_accounts WHERE account_number='EGSU-ABS-9999'")
        row = cur.fetchone()
        if not row:
            return err("Счёт поглощения не найден")
        abs_id, balance = row[0], float(row[1])

        if balance < min_amount:
            return ok({"status": "skipped", "message": f"Баланс ${balance:.2f} ниже минимума ${min_amount:.2f}", "balance": balance})

        # Создаём и сразу исполняем вывод
        cur.execute(f"""
            INSERT INTO {S}.egsu_withdrawal_requests
              (from_account_id, to_account_id, to_account_details, amount, currency, description, status, confirmed_at, executed_at)
            VALUES (%s,%s,%s,%s,'USD',%s,'executed',NOW(),NOW()) RETURNING id
        """, (abs_id, int(to_id) if to_id else None, json.dumps(to_details), balance, desc))
        wid = cur.fetchone()[0]

        # Списываем с absorption
        cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=0, updated_at=NOW() WHERE id=%s", (abs_id,))
        # Зачисляем на внутренний счёт если указан
        if to_id:
            cur.execute(f"UPDATE {S}.egsu_finance_accounts SET balance=balance+%s, updated_at=NOW() WHERE id=%s",
                        (balance, int(to_id)))
            cur.execute(f"""
                INSERT INTO {S}.egsu_finance_transactions
                  (account_id, tx_type, amount, currency, description, source, status)
                VALUES (%s,'income',%s,'USD',%s,'Auto-Withdrawal Absorption','completed')
            """, (int(to_id), balance, desc))
        # Расход на absorption
        cur.execute(f"""
            INSERT INTO {S}.egsu_finance_transactions
              (account_id, tx_type, amount, currency, description, source, status)
            VALUES (%s,'outcome',%s,'USD',%s,'Auto-Withdrawal','completed')
        """, (abs_id, balance, desc))

        db.commit()
        return ok({
            "status": "executed",
            "withdrawal_id": wid,
            "amount_usd": balance,
            "message": f"${balance:.2f} USD автоматически выведено со счёта поглощения.",
        }, 201)

    # ══════════════════════════════════════════════════════════════════════════
    # АНАЛИТИКА
    # ══════════════════════════════════════════════════════════════════════════

    if method == "GET" and "/analytics" in path and "/snapshots" not in path and "/export" not in path:
        cur.execute(f"SELECT COALESCE(SUM(balance),0) FROM {S}.egsu_finance_accounts WHERE is_active=true AND currency='USD'")
        total_balance = float(cur.fetchone()[0])
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {S}.egsu_finance_transactions WHERE tx_type='income' AND currency='USD'")
        total_income = float(cur.fetchone()[0])
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {S}.egsu_finance_transactions WHERE tx_type='outcome' AND currency='USD'")
        total_outcome = float(cur.fetchone()[0])
        cur.execute(f"SELECT balance FROM {S}.egsu_finance_accounts WHERE account_number='EGSU-ABS-9999'")
        row = cur.fetchone()
        absorption = float(row[0]) if row else 0
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events")
        total_events = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(penalty_amount),0) FROM {S}.egsu_security_events")
        total_penalties = float(cur.fetchone()[0])
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_blocked_ips")
        blocked_ips = cur.fetchone()[0]
        # Динамика по дням
        cur.execute(f"""
            SELECT DATE(created_at) as day,
                   SUM(CASE WHEN tx_type='income' THEN amount ELSE 0 END) as income,
                   SUM(CASE WHEN tx_type='outcome' THEN amount ELSE 0 END) as outcome
            FROM {S}.egsu_finance_transactions
            WHERE created_at >= NOW() - INTERVAL '30 days' AND currency='USD'
            GROUP BY day ORDER BY day
        """)
        daily = [{"date": str(r[0]), "income": float(r[1]), "outcome": float(r[2])} for r in cur.fetchall()]
        # Атаки по дням
        cur.execute(f"""
            SELECT DATE(created_at) as day, COUNT(*) as events, COALESCE(SUM(penalty_amount),0) as penalties
            FROM {S}.egsu_security_events
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY day ORDER BY day
        """)
        attack_daily = [{"date": str(r[0]), "events": r[1], "penalties": float(r[2])} for r in cur.fetchall()]
        # Распределение по счетам
        cur.execute(f"SELECT label, balance, currency FROM {S}.egsu_finance_accounts WHERE is_active=true ORDER BY balance DESC")
        accounts_dist = [{"label": r[0], "balance": float(r[1]), "currency": r[2]} for r in cur.fetchall()]
        # Топ транзакций
        cur.execute(f"""
            SELECT t.tx_type, t.amount, t.currency, t.description, t.created_at, a.label
            FROM {S}.egsu_finance_transactions t
            JOIN {S}.egsu_finance_accounts a ON a.id=t.account_id
            ORDER BY t.amount DESC LIMIT 10
        """)
        top_tx = [{"tx_type": r[0], "amount": float(r[1]), "currency": r[2],
                   "description": r[3], "created_at": str(r[4]), "account": r[5]} for r in cur.fetchall()]
        # Атаки по типам
        cur.execute(f"""
            SELECT event_type, COUNT(*) as cnt, COALESCE(SUM(penalty_amount),0) as total_penalty
            FROM {S}.egsu_security_events GROUP BY event_type ORDER BY cnt DESC
        """)
        attack_types = [{"type": r[0], "count": r[1], "penalty": float(r[2])} for r in cur.fetchall()]
        return ok({
            "finance": {"total_balance_usd": total_balance, "total_income_usd": total_income,
                        "total_outcome_usd": total_outcome, "net_usd": total_income - total_outcome,
                        "absorption_balance": absorption},
            "security": {"total_events": total_events, "total_penalties_usd": total_penalties, "blocked_ips": blocked_ips},
            "charts": {"daily_finance": daily, "daily_attacks": attack_daily,
                       "accounts_distribution": accounts_dist, "top_transactions": top_tx, "attack_types": attack_types},
        })

    if method == "GET" and "/analytics/export" in path:
        cur.execute(f"""
            SELECT id, owner_name, account_type, account_number, bank_name, currency, label, balance, created_at
            FROM {S}.egsu_finance_accounts WHERE is_active=true ORDER BY id
        """)
        accs = [{"id":r[0],"owner_name":r[1],"type":r[2],"number":r[3],"bank":r[4],"currency":r[5],"label":r[6],"balance":float(r[7]),"created_at":str(r[8])} for r in cur.fetchall()]
        cur.execute(f"""
            SELECT t.id, t.tx_type, t.amount, t.currency, t.description, t.source, t.status, t.created_at, a.label
            FROM {S}.egsu_finance_transactions t JOIN {S}.egsu_finance_accounts a ON a.id=t.account_id
            ORDER BY t.created_at DESC LIMIT 500
        """)
        txs = [{"id":r[0],"type":r[1],"amount":float(r[2]),"currency":r[3],"description":r[4],"source":r[5],"status":r[6],"created_at":str(r[7]),"account":r[8]} for r in cur.fetchall()]
        cur.execute(f"""
            SELECT id, event_type, severity, ip_address, description, penalty_amount, is_blocked, created_at
            FROM {S}.egsu_security_events ORDER BY created_at DESC
        """)
        sec = [{"id":r[0],"type":r[1],"severity":r[2],"ip":r[3],"description":r[4],"penalty":float(r[5]),"blocked":r[6],"created_at":str(r[7])} for r in cur.fetchall()]
        return ok({"exported_at": datetime.now().isoformat(), "system": "ECSU 2.0", "version": "2026",
                   "accounts": accs, "transactions": txs, "security_events": sec,
                   "summary": {"accounts": len(accs), "transactions": len(txs), "security_events": len(sec)}})

    if method == "POST" and "/analytics/snapshot" in path:
        cur.execute(f"SELECT COALESCE(SUM(balance),0) FROM {S}.egsu_finance_accounts WHERE is_active=true AND currency='USD'")
        tb = float(cur.fetchone()[0])
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {S}.egsu_finance_transactions WHERE tx_type='income' AND currency='USD'")
        ti = float(cur.fetchone()[0])
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {S}.egsu_finance_transactions WHERE tx_type='outcome' AND currency='USD'")
        to_ = float(cur.fetchone()[0])
        cur.execute(f"SELECT balance FROM {S}.egsu_finance_accounts WHERE account_number='EGSU-ABS-9999'")
        r = cur.fetchone(); ab = float(r[0]) if r else 0
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events"); sc = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(penalty_amount),0) FROM {S}.egsu_security_events"); pen = float(cur.fetchone()[0])
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_finance_accounts WHERE is_active=true"); ac = cur.fetchone()[0]
        cur.execute(f"""
            INSERT INTO {S}.egsu_analytics_snapshots
              (total_balance_usd,total_income_usd,total_outcome_usd,absorption_balance,
               security_events_count,penalties_collected,active_accounts)
            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (tb, ti, to_, ab, sc, pen, ac))
        snap_id = cur.fetchone()[0]
        db.commit()
        return ok({"id": snap_id, "message": "Снапшот создан"}, 201)

    if method == "GET" and "/analytics/snapshots" in path:
        cur.execute(f"""
            SELECT id, snapshot_date, total_balance_usd, total_income_usd, total_outcome_usd,
                   absorption_balance, security_events_count, penalties_collected, active_accounts, created_at
            FROM {S}.egsu_analytics_snapshots ORDER BY created_at DESC LIMIT 30
        """)
        cols = ["id","date","total_balance","total_income","total_outcome","absorption","sec_events","penalties","accounts","created_at"]
        result = [dict(zip(cols, r)) for r in cur.fetchall()]
        for row in result:
            for k in ["total_balance","total_income","total_outcome","absorption","penalties"]:
                row[k] = float(row[k]) if row[k] else 0
        return ok(result)

    # ══════════════════════════════════════════════════════════════════════════
    # ВЛАДЕЛЕЦ / НАСТРОЙКИ / УВЕДОМЛЕНИЯ
    # ══════════════════════════════════════════════════════════════════════════

    if method == "GET" and "/owner" in path and "/settings" not in path and "/access-log" not in path:
        cur.execute(f"SELECT setting_key, setting_value, setting_type, description FROM {S}.egsu_owner_settings ORDER BY setting_key")
        settings = {r[0]: {"value": r[1], "type": r[2], "description": r[3]} for r in cur.fetchall()}
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_notifications WHERE is_read=false")
        unread = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events WHERE created_at >= NOW() - INTERVAL '24 hours'")
        threats_today = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_finance_transactions WHERE created_at >= NOW() - INTERVAL '24 hours'")
        tx_today = cur.fetchone()[0]
        cur.execute(f"SELECT action, ip_address, created_at FROM {S}.egsu_access_log ORDER BY created_at DESC LIMIT 5")
        last_access = [{"action": r[0], "ip": r[1], "at": str(r[2])} for r in cur.fetchall()]
        return ok({"owner_name": settings.get("owner_display_name",{}).get("value","Владелец"),
                   "system_name": settings.get("system_name",{}).get("value","ECSU 2.0"),
                   "settings": settings,
                   "stats": {"unread_notifications": unread, "threats_today": threats_today, "transactions_today": tx_today},
                   "last_access": last_access})

    if method == "GET" and "/owner/settings" in path:
        cur.execute(f"SELECT setting_key, setting_value, setting_type, description, updated_at FROM {S}.egsu_owner_settings ORDER BY setting_key")
        return ok([{"key":r[0],"value":r[1],"type":r[2],"description":r[3],"updated_at":str(r[4])} for r in cur.fetchall()])

    if method == "PUT" and "/owner/settings" in path:
        key = body.get("key","").strip()
        value = str(body.get("value",""))
        if not key: return err("key обязателен")
        cur.execute(f"UPDATE {S}.egsu_owner_settings SET setting_value=%s, updated_at=NOW() WHERE setting_key=%s", (value, key))
        if cur.rowcount == 0:
            cur.execute(f"INSERT INTO {S}.egsu_owner_settings (setting_key, setting_value, setting_type) VALUES (%s,%s,'string')", (key, value))
        db.commit()
        return ok({"message": f"Настройка '{key}' обновлена"})

    if method == "GET" and "/owner/access-log" in path:
        cur.execute(f"SELECT id, action, ip_address, user_agent, details, created_at FROM {S}.egsu_access_log ORDER BY created_at DESC LIMIT 100")
        return ok([{"id":r[0],"action":r[1],"ip":r[2],"ua":r[3],"details":r[4],"at":str(r[5])} for r in cur.fetchall()])

    if method == "GET" and "/notifications" in path and "/read" not in path:
        cur.execute(f"""
            SELECT id, type, priority, title, body, source, is_read, action_url, created_at
            FROM {S}.egsu_notifications ORDER BY created_at DESC LIMIT 50
        """)
        cols = ["id","type","priority","title","body","source","is_read","action_url","created_at"]
        return ok(rows(cur, cols))

    if method == "POST" and "/notifications" in path and "/read" not in path:
        title = body.get("title","").strip()
        if not title: return err("title обязателен")
        cur.execute(f"""
            INSERT INTO {S}.egsu_notifications (type, priority, title, body, source, action_url)
            VALUES (%s,%s,%s,%s,%s,%s) RETURNING id
        """, (body.get("type","system"), body.get("priority","normal"), title,
              body.get("body",""), body.get("source","EGSU"), body.get("action_url","")))
        new_id = cur.fetchone()[0]
        db.commit()
        return ok({"id": new_id, "message": "Уведомление создано"}, 201)

    if method == "PUT" and "/notifications/" in path and "/read" in path:
        nid = int(path.split("/notifications/")[1].split("/")[0])
        cur.execute(f"UPDATE {S}.egsu_notifications SET is_read=true WHERE id=%s", (nid,))
        db.commit()
        return ok({"message": "Прочитано"})

    if method == "PUT" and "/notifications/read-all" in path:
        cur.execute(f"UPDATE {S}.egsu_notifications SET is_read=true WHERE is_read=false")
        count = cur.rowcount
        db.commit()
        return ok({"message": f"Отмечено прочитанными: {count}"})

    if method == "POST" and "/recovery" in path:
        reason = body.get("reason","")
        token = hashlib.sha256(f"EGSU-RECOVERY-{datetime.now().isoformat()}".encode()).hexdigest()[:16].upper()
        headers_ev = event.get("headers") or {}
        client_ip = headers_ev.get("x-forwarded-for", "unknown")
        cur.execute(f"""
            INSERT INTO {S}.egsu_access_log (action, ip_address, details)
            VALUES ('recovery_requested',%s,%s)
        """, (client_ip, json.dumps({"reason": reason})))
        cur.execute(f"""
            INSERT INTO {S}.egsu_notifications (type, priority, title, body, source)
            VALUES ('system','critical','Запрос восстановления доступа',%s,'Recovery Module')
        """, (f"Запрос с IP {client_ip}. Причина: {reason}",))
        db.commit()
        return ok({"message": "Запрос зафиксирован. Свяжитесь с администратором.", "token_prefix": token[:4]})

    # ══════════════════════════════════════════════════════════════════════════
    # ФОНД ДАЛАН — РАЗВИТИЕ ECSU
    # ══════════════════════════════════════════════════════════════════════════

    def esc(v):
        if v is None:
            return "NULL"
        return "'" + str(v).replace("'", "''") + "'"

    def calc_dist(gross, tax_rate, owner_pct, dev_pct):
        tax = round(gross * tax_rate / 100, 2)
        net = round(gross - tax, 2)
        owner = round(net * owner_pct / 100, 2)
        dev = round(net - owner, 2)
        return {"tax": tax, "net": net, "owner": owner, "dev": dev}

    # GET /fund — сводка фонда
    if method == "GET" and path.rstrip("/") == "/fund":
        cur.execute(f"SELECT * FROM {S}.egsu_fund_config LIMIT 1")
        cols = [d[0] for d in cur.description]
        cfg_row = cur.fetchone()
        config = dict(zip(cols, cfg_row)) if cfg_row else {}
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {S}.egsu_fund_income WHERE status='received'")
        total_income = float(cur.fetchone()[0])
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {S}.egsu_fund_withdrawals WHERE status='approved'")
        total_withdrawn = float(cur.fetchone()[0])
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {S}.egsu_fund_expenses WHERE status='approved'")
        total_expenses = float(cur.fetchone()[0])
        cur.execute(f"SELECT COALESCE(SUM(tax_amount),0), COALESCE(SUM(owner_amount),0), COALESCE(SUM(dev_amount),0) FROM {S}.egsu_fund_distributions")
        row = cur.fetchone()
        total_taxes, total_owner, total_dev = float(row[0]), float(row[1]), float(row[2])
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_fund_withdrawals WHERE status='pending'")
        pending_w = int(cur.fetchone()[0])
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_fund_expenses WHERE status='pending'")
        pending_e = int(cur.fetchone()[0])
        return ok({
            "config": config,
            "summary": {
                "total_income": total_income, "total_taxes_paid": total_taxes,
                "total_net": round(total_income - total_taxes, 2),
                "owner_share_total": total_owner, "dev_share_total": total_dev,
                "total_withdrawn": total_withdrawn, "total_expenses": total_expenses,
                "balance_owner": round(total_owner - total_withdrawn, 2),
                "balance_dev": round(total_dev - total_expenses, 2),
                "pending_withdrawals": pending_w, "pending_expenses": pending_e,
            }
        })

    # PUT /fund — обновить конфиг
    if method == "PUT" and path.rstrip("/") == "/fund":
        upd = []
        for f in ["fund_name","tax_mode","tax_rate_percent","owner_share_percent","dev_share_percent","owner_card_last4","owner_bank","description"]:
            if f in body:
                upd.append(f"{f}={esc(body[f])}")
        if upd:
            upd.append("updated_at=NOW()")
            cur.execute(f"UPDATE {S}.egsu_fund_config SET {', '.join(upd)} WHERE id=1")
            db.commit()
        return ok({"message": "Настройки фонда обновлены"})

    # GET /fund/income
    if method == "GET" and "/fund/income" in path:
        cur.execute(f"""
            SELECT i.*, d.tax_amount, d.net_amount, d.owner_amount, d.dev_amount
            FROM {S}.egsu_fund_income i
            LEFT JOIN {S}.egsu_fund_distributions d ON d.income_id = i.id
            ORDER BY i.created_at DESC LIMIT 100
        """)
        cols = [d[0] for d in cur.description]
        return ok({"income": [dict(zip(cols, r)) for r in cur.fetchall()]})

    # POST /fund/income
    if method == "POST" and "/fund/income" in path:
        src_type = (body.get("source_type") or "").strip()
        src_name = (body.get("source_name") or "").strip()
        amount = float(body.get("amount") or 0)
        if not src_type or not src_name or amount <= 0:
            return err("source_type, source_name и amount обязательны")
        cur.execute(f"INSERT INTO {S}.egsu_fund_income (source_type, source_name, amount, description) VALUES ({esc(src_type)},{esc(src_name)},{amount},{esc(body.get('description',''))}) RETURNING id")
        income_id = cur.fetchone()[0]
        cur.execute(f"SELECT tax_rate_percent, owner_share_percent, dev_share_percent FROM {S}.egsu_fund_config LIMIT 1")
        cfg = cur.fetchone()
        tax_rate, owner_pct, dev_pct = (float(cfg[0]), float(cfg[1]), float(cfg[2])) if cfg else (13.0, 51.0, 49.0)
        d = calc_dist(amount, tax_rate, owner_pct, dev_pct)
        cur.execute(f"INSERT INTO {S}.egsu_fund_distributions (income_id, gross_amount, tax_amount, net_amount, owner_amount, dev_amount, tax_rate) VALUES ({income_id},{amount},{d['tax']},{d['net']},{d['owner']},{d['dev']},{tax_rate})")
        db.commit()
        return ok({"id": income_id, "message": "Поступление зарегистрировано", "distribution": d}, 201)

    # GET /fund/withdrawals
    if method == "GET" and "/fund/withdrawals" in path:
        cur.execute(f"SELECT * FROM {S}.egsu_fund_withdrawals ORDER BY requested_at DESC LIMIT 100")
        cols = [d[0] for d in cur.description]
        return ok({"withdrawals": [dict(zip(cols, r)) for r in cur.fetchall()]})

    # POST /fund/withdrawals
    if method == "POST" and "/fund/withdrawals" in path:
        amount = float(body.get("amount") or 0)
        if amount <= 0:
            return err("amount обязателен")
        cur.execute(f"INSERT INTO {S}.egsu_fund_withdrawals (withdrawal_type, amount, destination, description, status) VALUES ({esc(body.get('withdrawal_type','owner'))},{amount},{esc(body.get('destination',''))},{esc(body.get('description',''))},'pending') RETURNING id, requested_at")
        r = cur.fetchone()
        db.commit()
        return ok({"id": r[0], "message": "Заявка создана. Ожидает ручного подтверждения.", "requested_at": str(r[1])}, 201)

    # PUT /fund/withdrawals
    if method == "PUT" and "/fund/withdrawals" in path:
        wid = body.get("id")
        if not wid:
            return err("id обязателен")
        status_val = body.get("status", "approved")
        approved_at = "NOW()" if status_val == "approved" else "NULL"
        cur.execute(f"UPDATE {S}.egsu_fund_withdrawals SET status={esc(status_val)}, notes={esc(body.get('notes',''))}, approved_at={approved_at} WHERE id={int(wid)} RETURNING id, status")
        r = cur.fetchone()
        db.commit()
        return ok({"id": r[0] if r else wid, "status": r[1] if r else status_val})

    # GET /fund/expenses
    if method == "GET" and "/fund/expenses" in path:
        cur.execute(f"SELECT * FROM {S}.egsu_fund_expenses ORDER BY created_at DESC LIMIT 100")
        cols = [d[0] for d in cur.description]
        return ok({"expenses": [dict(zip(cols, r)) for r in cur.fetchall()]})

    # POST /fund/expenses
    if method == "POST" and "/fund/expenses" in path:
        category = (body.get("category") or "").strip()
        item_name = (body.get("item_name") or "").strip()
        amount = float(body.get("amount") or 0)
        if not category or not item_name or amount <= 0:
            return err("category, item_name и amount обязательны")
        cur.execute(f"INSERT INTO {S}.egsu_fund_expenses (category, item_name, amount, description, status) VALUES ({esc(category)},{esc(item_name)},{amount},{esc(body.get('description',''))},'pending') RETURNING id, created_at")
        r = cur.fetchone()
        db.commit()
        return ok({"id": r[0], "message": "Расход зарегистрирован. Ожидает подтверждения."}, 201)

    # PUT /fund/expenses
    if method == "PUT" and "/fund/expenses" in path:
        eid = body.get("id")
        if not eid:
            return err("id обязателен")
        status_val = body.get("status", "approved")
        approved_at = "NOW()" if status_val == "approved" else "NULL"
        cur.execute(f"UPDATE {S}.egsu_fund_expenses SET status={esc(status_val)}, approved_at={approved_at} WHERE id={int(eid)} RETURNING id, status")
        r = cur.fetchone()
        db.commit()
        return ok({"id": r[0] if r else eid, "status": r[1] if r else status_val})

    # GET /fund/categories
    if method == "GET" and "/fund/categories" in path:
        cur.execute(f"SELECT * FROM {S}.egsu_fund_expense_categories ORDER BY id")
        cols = [d[0] for d in cur.description]
        return ok({"categories": [dict(zip(cols, r)) for r in cur.fetchall()]})

    return err("Маршрут не найден", 404)