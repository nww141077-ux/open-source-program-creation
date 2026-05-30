"""
Правовая база ЕЦСУ: юрисдикции, документы, статьи.
Владелец: Николаев В.В.
"""
import json, os, psycopg2

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

def rows(cur):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    qs = event.get("queryStringParameters") or {}

    con = db()
    cur = con.cursor()

    # GET / — stats
    if path in ("/", ""):
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_legal_jurisdictions")
        jcount = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_legal_documents WHERE is_active = true")
        dcount = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_legal_articles")
        acount = cur.fetchone()[0]
        con.close()
        return resp(200, {"stats": {"jurisdictions": jcount, "documents": dcount, "articles": acount}})

    # GET /jurisdictions
    if path.endswith("/jurisdictions"):
        cur.execute(f"""
            SELECT j.id, j.code, j.name, j.country, j.type,
                   COUNT(d.id) as doc_count
            FROM {S}.egsu_legal_jurisdictions j
            LEFT JOIN {S}.egsu_legal_documents d ON d.jurisdiction_id = j.id AND d.is_active = true
            GROUP BY j.id ORDER BY j.name
        """)
        con.close()
        return resp(200, rows(cur))

    # GET /documents
    if path.endswith("/documents"):
        jur_id = qs.get("jurisdiction_id")
        cat = qs.get("category", "")
        where = ["d.is_active = true"]
        params = []
        if jur_id:
            where.append("d.jurisdiction_id = %s")
            params.append(int(jur_id))
        if cat:
            where.append("d.category = %s")
            params.append(cat)
        w = " AND ".join(where)
        cur.execute(f"""
            SELECT d.id, d.code, d.title, d.category, d.description, d.adopted_year,
                   j.name as jurisdiction, j.code as jcode,
                   COUNT(a.id) as article_count
            FROM {S}.egsu_legal_documents d
            JOIN {S}.egsu_legal_jurisdictions j ON j.id = d.jurisdiction_id
            LEFT JOIN {S}.egsu_legal_articles a ON a.document_id = d.id
            WHERE {w}
            GROUP BY d.id, j.name, j.code ORDER BY d.adopted_year DESC
        """, params)
        con.close()
        return resp(200, rows(cur))

    # GET /articles
    if path.endswith("/articles"):
        doc_id = qs.get("document_id")
        q = qs.get("q", "")
        if doc_id:
            cur.execute(f"""
                SELECT a.id, a.article_number, a.title, a.content, a.tags,
                       d.title as doc_title, d.code as doc_code, j.name as jurisdiction
                FROM {S}.egsu_legal_articles a
                JOIN {S}.egsu_legal_documents d ON d.id = a.document_id
                JOIN {S}.egsu_legal_jurisdictions j ON j.id = d.jurisdiction_id
                WHERE a.document_id = %s ORDER BY a.article_number
            """, (int(doc_id),))
        elif q:
            cur.execute(f"""
                SELECT a.id, a.article_number, a.title, a.content, a.tags,
                       d.title as doc_title, d.code as doc_code, j.name as jurisdiction
                FROM {S}.egsu_legal_articles a
                JOIN {S}.egsu_legal_documents d ON d.id = a.document_id
                JOIN {S}.egsu_legal_jurisdictions j ON j.id = d.jurisdiction_id
                WHERE to_tsvector('russian', a.content || ' ' || COALESCE(a.title,'')) @@ plainto_tsquery('russian', %s)
                   OR lower(a.content) LIKE lower(%s)
                LIMIT 50
            """, (q, f"%{q}%"))
        else:
            con.close()
            return resp(200, [])
        con.close()
        return resp(200, rows(cur))

    con.close()
    return resp(404, {"error": "Not found"})
