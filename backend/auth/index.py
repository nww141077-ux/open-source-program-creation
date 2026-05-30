"""
Авторизация ЕЦСУ 2.0: регистрация, вход.
action: register | login
"""
import json
import os
import hashlib
import secrets
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(f"nexaflow2026{password}".encode()).hexdigest()

def make_token(user_id: int, role: str) -> str:
    return hashlib.sha256(f"{user_id}:{role}:{secrets.token_hex(16)}".encode()).hexdigest()[:48]

def resp(status: int, data: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": json.dumps(data, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = {}
    if event.get("body"):
        raw = event["body"]
        body = json.loads(raw) if isinstance(raw, str) else raw

    action = body.get("action", "")

    # Регистрация
    if action == "register":
        name     = (body.get("name") or "").strip()
        email    = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""

        if not name or not email or not password:
            return resp(400, {"error": "Заполните все поля"})
        if len(password) < 6:
            return resp(400, {"error": "Пароль минимум 6 символов"})

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM t_p38294978_open_source_program_.users WHERE email = %s", (email,))
        if cur.fetchone():
            conn.close()
            return resp(409, {"error": "Email уже зарегистрирован"})

        pw_hash = hash_password(password)
        cur.execute(
            "INSERT INTO t_p38294978_open_source_program_.users (email, username, password_hash, role) VALUES (%s, %s, %s, 'user') RETURNING id",
            (email, name, pw_hash)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        conn.close()

        return resp(200, {"token": make_token(user_id, "user"), "role": "user", "name": name, "userId": user_id})

    # Вход
    if action == "login":
        email    = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""

        if not email or not password:
            return resp(400, {"error": "Введите email и пароль"})

        conn = get_conn()
        cur = conn.cursor()
        pw_hash = hash_password(password)
        cur.execute(
            "SELECT id, username, role FROM t_p38294978_open_source_program_.users WHERE email = %s AND password_hash = %s",
            (email, pw_hash)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return resp(401, {"error": "Неверный email или пароль"})

        user_id, name, role = row
        cur.execute("UPDATE t_p38294978_open_source_program_.users SET last_login = now() WHERE id = %s", (user_id,))
        conn.commit()
        conn.close()

        return resp(200, {"token": make_token(user_id, role), "role": role, "name": name, "userId": user_id})

    return resp(400, {"error": "Неизвестное действие"})