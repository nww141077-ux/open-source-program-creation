"""
Аутентификация пользователей: регистрация и вход.
POST /register — создание аккаунта (email, username, password)
POST /login    — вход (email, password)
GET  /verify   — проверка токена
"""
import json
import os
import hashlib
import hmac
import time
import psycopg2

SCHEMA = "t_p38294978_open_source_program_"
SECRET = os.environ.get("USER_AUTH_SECRET", "egsu_user_secret_key_2024")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def ok(data: dict, code: int = 200):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False)}


def err(msg: str, code: int = 400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def hash_password(password: str) -> str:
    salt = "egsu2024"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def make_token(user_id: int, email: str) -> str:
    payload = f"{user_id}:{email}:{int(time.time())}"
    sig = hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    import base64
    encoded = base64.b64encode(payload.encode()).decode()
    return f"{encoded}.{sig}"


def verify_token(token: str):
    try:
        import base64
        parts = token.split(".")
        if len(parts) != 2:
            return None
        encoded, sig = parts
        payload = base64.b64decode(encoded).decode()
        expected = hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        uid, email, ts = payload.split(":")
        return {"user_id": int(uid), "email": email, "issued_at": int(ts)}
    except Exception:
        return None


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Неверный JSON")

    action = body.get("action") or (event.get("queryStringParameters") or {}).get("action", "")

    # ── РЕГИСТРАЦИЯ ──
    if (action == "register" or path.endswith("/register")) and method == "POST":
        email = (body.get("email") or "").strip().lower()
        username = (body.get("username") or "").strip()
        password = body.get("password") or ""

        if not email or not username or not password:
            return err("Заполните email, имя пользователя и пароль")
        if len(password) < 6:
            return err("Пароль должен быть не менее 6 символов")
        if "@" not in email:
            return err("Некорректный email")

        pw_hash = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (email, username, password_hash) VALUES (%s, %s, %s) RETURNING id",
                (email, username, pw_hash)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return err("Email или имя пользователя уже зарегистрированы", 409)
        finally:
            cur.close()
            conn.close()

        token = make_token(user_id, email)
        return ok({"token": token, "user_id": user_id, "email": email, "username": username}, 201)

    # ── ВХОД ──
    if (action == "login" or path.endswith("/login")) and method == "POST":
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""

        if not email or not password:
            return err("Введите email и пароль")

        pw_hash = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, username FROM {SCHEMA}.users WHERE email=%s AND password_hash=%s",
            (email, pw_hash)
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return err("Неверный email или пароль", 401)

        user_id, username = row
        cur.execute(f"UPDATE {SCHEMA}.users SET last_login=NOW() WHERE id=%s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()

        token = make_token(user_id, email)
        return ok({"token": token, "user_id": user_id, "email": email, "username": username})

    # ── ПРОВЕРКА ТОКЕНА ──
    if (action == "verify" or path.endswith("/verify")) and method in ("GET", "POST"):
        auth = event.get("headers", {}).get("X-Authorization", "") or event.get("headers", {}).get("Authorization", "")
        token = auth.replace("Bearer ", "").strip()
        if not token:
            return err("Токен не передан", 401)
        payload = verify_token(token)
        if not payload:
            return err("Токен недействителен", 401)
        return ok({"valid": True, **payload})

    return err("Маршрут не найден", 404)