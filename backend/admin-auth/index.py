import os
import json
import hashlib
import hmac
import base64
import time
import psycopg2

SCHEMA = "t_p38294978_open_source_program_"
SECRET = "egsu_admin_secret_key_2024"


def make_token(username: str) -> str:
    """Создаём JWT-подобный токен"""
    payload = json.dumps({"u": username, "exp": int(time.time()) + 3600})
    b64 = base64.urlsafe_b64encode(payload.encode()).decode()
    sig = hmac.new(SECRET.encode(), b64.encode(), hashlib.sha256).hexdigest()
    return f"{b64}.{sig}"


def verify_token(token: str) -> str | None:
    """Проверяем токен, возвращаем username или None"""
    try:
        b64, sig = token.rsplit(".", 1)
        expected = hmac.new(SECRET.encode(), b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(b64).decode())
        if payload["exp"] < int(time.time()):
            return None
        return payload["u"]
    except Exception:
        return None


def check_password(password: str, stored_hash: str) -> bool:
    """Проверяем пароль — для простоты используем sha256 с солью"""
    h = hashlib.sha256((password + SECRET).encode()).hexdigest()
    return h == stored_hash


def make_password_hash(password: str) -> str:
    return hashlib.sha256((password + SECRET).encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """Аутентификация администратора панели управления"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # POST /login or POST /
    if method == "POST" and ("/login" in path or path in ["/", ""]):
        body = json.loads(event.get("body") or "{}")
        username = body.get("username", "").strip()
        password = body.get("password", "")

        # Проверка блокировки
        cur.execute(
            f"SELECT id, password_hash, login_attempts, locked_until FROM {SCHEMA}.admin_users WHERE username = %s",
            (username,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Неверный логин или пароль"})}

        uid, pwd_hash, attempts, locked_until = row

        if locked_until and locked_until.timestamp() > time.time():
            conn.close()
            return {"statusCode": 429, "headers": cors, "body": json.dumps({"error": "Аккаунт временно заблокирован. Попробуйте через час."})}

        # Первый вход — если hash совпадает со старым bcrypt-заглушкой, принимаем пароль "admin123"
        if pwd_hash == "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uTNK":
            ok = password == "admin123"
            if ok:
                new_hash = make_password_hash(password)
                cur.execute(f"UPDATE {SCHEMA}.admin_users SET password_hash = %s, login_attempts = 0, locked_until = NULL WHERE id = %s", (new_hash, uid))
        else:
            ok = check_password(password, pwd_hash)

        if not ok:
            new_attempts = attempts + 1
            if new_attempts >= 5:
                cur.execute(
                    f"UPDATE {SCHEMA}.admin_users SET login_attempts = %s, locked_until = NOW() + INTERVAL '1 hour' WHERE id = %s",
                    (new_attempts, uid)
                )
                conn.commit()
                conn.close()
                return {"statusCode": 429, "headers": cors, "body": json.dumps({"error": "Слишком много попыток. Аккаунт заблокирован на 1 час."})}
            cur.execute(f"UPDATE {SCHEMA}.admin_users SET login_attempts = %s WHERE id = %s", (new_attempts, uid))
            conn.commit()
            conn.close()
            return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Неверный логин или пароль"})}

        cur.execute(f"UPDATE {SCHEMA}.admin_users SET login_attempts = 0, locked_until = NULL WHERE id = %s", (uid,))
        cur.execute(f"INSERT INTO {SCHEMA}.admin_logs (action, username) VALUES (%s, %s)", ("Вход в панель управления", username))
        conn.commit()
        conn.close()

        token = make_token(username)
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"token": token, "username": username})}

    # GET /verify
    if method == "GET" and "/verify" in path:
        auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("Authorization", "")
        token = auth.replace("Bearer ", "")
        user = verify_token(token)
        conn.close()
        if user:
            return {"statusCode": 200, "headers": cors, "body": json.dumps({"valid": True, "username": user})}
        return {"statusCode": 401, "headers": cors, "body": json.dumps({"valid": False})}

    conn.close()
    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}