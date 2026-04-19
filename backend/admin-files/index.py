import os
import json
import hashlib
import hmac
import base64
import time
import psycopg2
import boto3

SCHEMA = "t_p38294978_open_source_program_"
SECRET = "egsu_admin_secret_key_2024"


def verify_token(token: str) -> str | None:
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


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def handler(event: dict, context) -> dict:
    """Файловый менеджер панели администратора"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    auth_header = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("Authorization", "")
    token = auth_header.replace("Bearer ", "")
    user = verify_token(token)
    if not user:
        return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Не авторизован"})}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # GET / — список файлов
    if method == "GET":
        cur.execute(
            f"SELECT id, filename, original_name, file_size, content_type, cdn_url, uploaded_at FROM {SCHEMA}.admin_files ORDER BY uploaded_at DESC"
        )
        files = [
            {"id": r[0], "filename": r[1], "original_name": r[2], "size": r[3], "content_type": r[4], "url": r[5], "uploaded_at": r[6].isoformat()}
            for r in cur.fetchall()
        ]
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"files": files})}

    # POST /upload — загрузить файл
    if method == "POST" and "/upload" in path:
        body = json.loads(event.get("body") or "{}")
        filename = body.get("filename", "file.bin")
        content_b64 = body.get("content", "")
        content_type = body.get("content_type", "application/octet-stream")

        data = base64.b64decode(content_b64)
        key = f"admin-files/{int(time.time())}_{filename}"

        s3 = get_s3()
        s3.put_object(Bucket="files", Key=key, Body=data, ContentType=content_type)
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        cur.execute(
            f"INSERT INTO {SCHEMA}.admin_files (filename, original_name, file_size, content_type, s3_key, cdn_url) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (key, filename, len(data), content_type, key, cdn_url)
        )
        file_id = cur.fetchone()[0]
        cur.execute(f"INSERT INTO {SCHEMA}.admin_logs (action, details, username) VALUES (%s, %s, %s)",
                    ("Загружен файл", filename, user))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True, "id": file_id, "url": cdn_url})}

    # POST /rename — переименовать
    if method == "POST" and "/rename" in path:
        body = json.loads(event.get("body") or "{}")
        file_id = body.get("id")
        new_name = body.get("name", "")
        cur.execute(f"UPDATE {SCHEMA}.admin_files SET original_name = %s WHERE id = %s", (new_name, file_id))
        cur.execute(f"INSERT INTO {SCHEMA}.admin_logs (action, details, username) VALUES (%s, %s, %s)",
                    ("Переименован файл", f"ID={file_id} → {new_name}", user))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    # DELETE / — удалить файл
    if method == "DELETE":
        params = event.get("queryStringParameters") or {}
        file_id = params.get("id")
        cur.execute(f"SELECT s3_key, original_name FROM {SCHEMA}.admin_files WHERE id = %s", (file_id,))
        row = cur.fetchone()
        if row:
            s3 = get_s3()
            try:
                s3.delete_object(Bucket="files", Key=row[0])
            except Exception:
                pass
            cur.execute(f"DELETE FROM {SCHEMA}.admin_files WHERE id = %s", (file_id,))
            cur.execute(f"INSERT INTO {SCHEMA}.admin_logs (action, details, username) VALUES (%s, %s, %s)",
                        ("Удалён файл", row[1], user))
            conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}
