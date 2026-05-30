"""
Уведомления ЕЦСУ 2.0: список, создание, отметка прочитанными.
Владелец: Николаев В.В.
"""
import json, os, psycopg2

S = "t_p38294978_open_source_program_"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def resp(status, data):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}

def rows(cur):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        raw = event["body"]
        body = json.loads(raw) if isinstance(raw, str) else raw

    con = db()
    cur = con.cursor()

    # GET /notifications
    if method == "GET" and path.endswith("/notifications"):
        cur.execute(f"""
            SELECT id, type, priority, title, body, source, is_read, action_url, created_at
            FROM {S}.egsu_notifications
            ORDER BY is_read ASC, created_at DESC LIMIT 100
        """)
        con.close()
        return resp(200, rows(cur))

    # POST /notifications
    if method == "POST" and path.endswith("/notifications"):
        cur.execute(f"""
            INSERT INTO {S}.egsu_notifications (type, priority, title, body, source, action_url)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            body.get("type", "system"), body.get("priority", "normal"),
            body.get("title", ""), body.get("body", ""),
            body.get("source", "ЕЦСУ"), body.get("action_url", "")
        ))
        new_id = cur.fetchone()[0]
        con.commit(); con.close()
        return resp(200, {"id": new_id, "message": "Уведомление создано"})

    # PUT /notifications/read-all
    if method == "PUT" and path.endswith("/read-all"):
        cur.execute(f"UPDATE {S}.egsu_notifications SET is_read = true WHERE is_read = false")
        con.commit(); con.close()
        return resp(200, {"ok": True})

    # PUT /notifications/{id}/read
    if method == "PUT" and "/notifications/" in path and path.endswith("/read"):
        parts = path.split("/")
        try:
            nid = int(parts[-2])
            cur.execute(f"UPDATE {S}.egsu_notifications SET is_read = true WHERE id = %s", (nid,))
            con.commit(); con.close()
            return resp(200, {"ok": True})
        except (ValueError, IndexError):
            con.close()
            return resp(400, {"error": "Invalid id"})

    con.close()
    return resp(404, {"error": "Not found"})
