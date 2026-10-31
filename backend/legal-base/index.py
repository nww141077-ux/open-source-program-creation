"""
API правовой базы ЕЦСУ — поиск по законодательству, юрисдикциям, статьям.
Также управление API-интеграциями для внешних платформ.
"""
import json
import os
import psycopg2

SCHEMA = "t_p38294978_open_source_program_"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {"statusCode": 200, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    path = event.get("path", "/")

    conn = get_conn()
    cur = conn.cursor()

    # GET /jurisdictions
    if method == "GET" and path.endswith("/jurisdictions"):
        cur.execute(f"""
            SELECT j.id, j.code, j.name, j.country, j.type,
                   COUNT(d.id) as doc_count
            FROM {SCHEMA}.egsu_legal_jurisdictions j
            LEFT JOIN {SCHEMA}.egsu_legal_documents d ON d.jurisdiction_id = j.id
            GROUP BY j.id ORDER BY j.type, j.name
        """)
        rows = cur.fetchall()
        cols = ["id", "code", "name", "country", "type", "doc_count"]
        return ok([dict(zip(cols, r)) for r in rows])

    # GET /documents
    if method == "GET" and path.endswith("/documents"):
        jid = params.get("jurisdiction_id")
        cat = params.get("category")
        query = f"""
            SELECT d.id, d.code, d.title, d.category, d.description,
                   d.adopted_year, j.name as jurisdiction, j.code as jcode,
                   COUNT(a.id) as article_count
            FROM {SCHEMA}.egsu_legal_documents d
            JOIN {SCHEMA}.egsu_legal_jurisdictions j ON j.id = d.jurisdiction_id
            LEFT JOIN {SCHEMA}.egsu_legal_articles a ON a.document_id = d.id
            WHERE d.is_active = true
        """
        if jid:
            query += f" AND d.jurisdiction_id = {int(jid)}"
        if cat:
            query += f" AND d.category = '{cat}'"
        query += " GROUP BY d.id, j.name, j.code ORDER BY d.category, d.title"
        cur.execute(query)
        rows = cur.fetchall()
        cols = ["id", "code", "title", "category", "description", "adopted_year", "jurisdiction", "jcode", "article_count"]
        return ok([dict(zip(cols, r)) for r in rows])

    # GET /articles
    if method == "GET" and path.endswith("/articles"):
        doc_id = params.get("document_id")
        search = params.get("q", "").strip()
        limit = min(int(params.get("limit", 20)), 100)

        if search:
            cur.execute(f"""
                SELECT a.id, a.article_number, a.title, a.content, a.tags,
                       d.title as doc_title, d.code as doc_code, j.name as jurisdiction
                FROM {SCHEMA}.egsu_legal_articles a
                JOIN {SCHEMA}.egsu_legal_documents d ON d.id = a.document_id
                JOIN {SCHEMA}.egsu_legal_jurisdictions j ON j.id = d.jurisdiction_id
                WHERE to_tsvector('russian', a.content || ' ' || COALESCE(a.title, ''))
                      @@ plainto_tsquery('russian', %s)
                ORDER BY a.id LIMIT %s
            """, (search, limit))
        elif doc_id:
            cur.execute(f"""
                SELECT a.id, a.article_number, a.title, a.content, a.tags,
                       d.title as doc_title, d.code as doc_code, j.name as jurisdiction
                FROM {SCHEMA}.egsu_legal_articles a
                JOIN {SCHEMA}.egsu_legal_documents d ON d.id = a.document_id
                JOIN {SCHEMA}.egsu_legal_jurisdictions j ON j.id = d.jurisdiction_id
                WHERE a.document_id = %s
                ORDER BY a.id LIMIT %s
            """, (int(doc_id), limit))
        else:
            cur.execute(f"""
                SELECT a.id, a.article_number, a.title, a.content, a.tags,
                       d.title as doc_title, d.code as doc_code, j.name as jurisdiction
                FROM {SCHEMA}.egsu_legal_articles a
                JOIN {SCHEMA}.egsu_legal_documents d ON d.id = a.document_id
                JOIN {SCHEMA}.egsu_legal_jurisdictions j ON j.id = d.jurisdiction_id
                ORDER BY a.id LIMIT %s
            """, (limit,))

        rows = cur.fetchall()
        cols = ["id", "article_number", "title", "content", "tags", "doc_title", "doc_code", "jurisdiction"]
        return ok([dict(zip(cols, r)) for r in rows])

    # GET /integrations — публичный реестр интеграций
    if method == "GET" and path.endswith("/integrations"):
        cur.execute(f"""
            SELECT id, platform_name, description, permissions, is_active,
                   requests_count, created_at, last_used_at
            FROM {SCHEMA}.egsu_api_integrations
            ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        cols = ["id", "platform_name", "description", "permissions", "is_active", "requests_count", "created_at", "last_used_at"]
        return ok([dict(zip(cols, r)) for r in rows])

    # POST /integrations — зарегистрировать новую интеграцию
    if method == "POST" and path.endswith("/integrations"):
        body = json.loads(event.get("body") or "{}")
        name = body.get("platform_name", "").strip()
        desc = body.get("description", "")
        perms = body.get("permissions", ["read"])
        if not name:
            return err("platform_name обязателен")
        import secrets
        api_key = f"egsu-{secrets.token_hex(12)}"
        cur.execute(f"""
            INSERT INTO {SCHEMA}.egsu_api_integrations (platform_name, api_key, description, permissions)
            VALUES (%s, %s, %s, %s) RETURNING id, api_key
        """, (name, api_key, desc, perms))
        row = cur.fetchone()
        conn.commit()
        return ok({"id": row[0], "api_key": row[1], "message": "Интеграция зарегистрирована"})

    # GET / — статистика базы
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.egsu_legal_jurisdictions")
    j_count = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.egsu_legal_documents")
    d_count = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.egsu_legal_articles")
    a_count = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.egsu_api_integrations WHERE is_active = true")
    i_count = cur.fetchone()[0]

    return ok({
        "system": "ЕЦСУ 2.0 — Правовая база",
        "version": "1.0",
        "stats": {
            "jurisdictions": j_count,
            "documents": d_count,
            "articles": a_count,
            "integrations": i_count,
        },
        "endpoints": [
            "GET /jurisdictions",
            "GET /documents?jurisdiction_id=&category=",
            "GET /articles?document_id=&q=поиск",
            "GET /integrations",
            "POST /integrations",
        ]
    })
