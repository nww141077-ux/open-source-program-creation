"""
API инцидентов ЕЦСУ — международные данные из БД.
Возвращает инциденты с фильтрацией по уровню, стране, статусу.
Также возвращает статистику и список стран.
"""
import json
import os
import psycopg2

SCHEMA = "t_p38294978_open_source_program_"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "list")

    conn = get_conn()
    cur = conn.cursor()

    if action == "stats":
        cur.execute(f"""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low,
                SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as active
            FROM {SCHEMA}.egsu_incidents
        """)
        row = cur.fetchone()
        stats = {
            "total": int(row[0]),
            "critical": int(row[1]),
            "high": int(row[2]),
            "medium": int(row[3]),
            "low": int(row[4]),
            "resolved": int(row[5]),
            "active": int(row[6]),
        }

        cur.execute(f"SELECT COUNT(DISTINCT country) FROM {SCHEMA}.egsu_incidents")
        stats["countries"] = int(cur.fetchone()[0])

        conn.close()
        return {"statusCode": 200, "headers": headers, "body": json.dumps(stats)}

    if action == "countries":
        cur.execute(f"""
            SELECT DISTINCT country, COUNT(*) as cnt
            FROM {SCHEMA}.egsu_incidents
            GROUP BY country
            ORDER BY cnt DESC
            LIMIT 50
        """)
        rows = cur.fetchall()
        conn.close()
        return {"statusCode": 200, "headers": headers, "body": json.dumps([
            {"country": r[0], "count": int(r[1])} for r in rows
        ])}

    severity = params.get("severity", "")
    limit = min(int(params.get("limit", "50")), 200)
    offset = int(params.get("offset", "0"))

    where = ""
    if severity and severity != "all":
        where = f"WHERE severity = '{severity}'"

    cur.execute(f"""
        SELECT
            id, incident_code, type, title, description,
            country, location, severity, status,
            ai_confidence, created_at,
            has_photo, has_video, has_official_source
        FROM {SCHEMA}.egsu_incidents
        {where}
        ORDER BY
            CASE severity
                WHEN 'critical' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
                ELSE 5
            END,
            created_at DESC
        LIMIT {limit} OFFSET {offset}
    """)
    rows = cur.fetchall()
    cols = ["id","code","type","title","description","country","location",
            "severity","status","ai_confidence","created_at","has_photo","has_video","has_official_source"]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.egsu_incidents {where}")
    total = int(cur.fetchone()[0])

    conn.close()

    incidents = []
    for r in rows:
        inc = dict(zip(cols, r))
        inc["created_at"] = inc["created_at"].isoformat() if inc["created_at"] else None
        incidents.append(inc)

    return {"statusCode": 200, "headers": headers, "body": json.dumps({
        "incidents": incidents,
        "total": total,
        "limit": limit,
        "offset": offset
    })}
