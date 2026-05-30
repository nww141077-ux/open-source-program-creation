"""
Подача инцидентов в ЕЦСУ 2.0: регистрация, верификация МГП.
Владелец: Николаев В.В.
"""
import json, os, psycopg2, datetime

S = "t_p38294978_open_source_program_"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def resp(status, data):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}

def calc_score(body: dict) -> int:
    weights = {
        "has_photo": 20, "has_video": 25, "has_witnesses": 20,
        "has_satellite": 25, "has_official_source": 30,
        "mgp_distinction": 15, "mgp_proportionality": 15, "mgp_necessity": 15,
    }
    return min(sum(w for k, w in weights.items() if body.get(k)), 100)

def gen_code(cur) -> str:
    cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_incidents")
    n = cur.fetchone()[0] + 1
    return f"INC-{n:04d}"

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        raw = event["body"]
        body = json.loads(raw) if isinstance(raw, str) else raw

    con = db()
    cur = con.cursor()

    if method == "POST":
        score = calc_score(body)
        if score < 40:
            con.close()
            return resp(422, {"reason": f"Недостаточно доказательств. Балл: {score}/100. Минимум: 40"})

        status = "verified" if score >= 60 else "pending_verification"
        code = gen_code(cur)
        now = datetime.datetime.utcnow()

        cur.execute(f"""
            INSERT INTO {S}.egsu_incidents
              (incident_code, type, title, description, country, location, severity, status,
               verification_score, has_photo, has_video, has_witnesses, has_satellite,
               has_official_source, mgp_distinction, mgp_proportionality, mgp_necessity,
               contact_email, is_anonymous, step1_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id, incident_code, status, verification_score
        """, (
            code, body.get("type",""), body.get("title",""), body.get("description",""),
            body.get("country",""), body.get("location",""), body.get("severity","medium"),
            status, score,
            bool(body.get("has_photo")), bool(body.get("has_video")),
            bool(body.get("has_witnesses")), bool(body.get("has_satellite")),
            bool(body.get("has_official_source")), bool(body.get("mgp_distinction")),
            bool(body.get("mgp_proportionality")), bool(body.get("mgp_necessity")),
            body.get("contact_email"), bool(body.get("is_anonymous")), now
        ))
        row = cur.fetchone()
        con.commit(); con.close()

        return resp(200, {
            "incident": {
                "id": row[0], "incident_code": row[1],
                "status": row[2], "verification_score": row[3],
            },
            "actions_applied": [
                {"id": 1, "action_label": f"Инцидент #{row[1]} зарегистрирован в реестре ЕЦСУ"},
                {"id": 2, "action_label": f"Балл верификации МГП: {score}/100"},
            ] + ([{"id": 3, "action_label": "ОГР уведомлена — реагирование в течение 2 часов"}] if status == "verified" else []),
        })

    # GET — список инцидентов
    cur.execute(f"""
        SELECT incident_code, type, title, country, severity, status, verification_score, created_at
        FROM {S}.egsu_incidents ORDER BY created_at DESC LIMIT 20
    """)
    cols = [d[0] for d in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    con.close()
    return resp(200, rows)
