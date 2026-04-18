"""
ECSU 2.0 — «Ковчег» — администрирование инфраструктуры
Управление серверами, режимами системы, мониторинг, логи.
Доступ: только владелец системы (Николаев В.В.)
"""
import json
import os
import random
from datetime import datetime, timezone, timedelta

import psycopg2
from psycopg2.extras import RealDictCursor

S = "t_p38294978_open_source_program_"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Owner-Token, X-User-Id",
}

OWNER_TOKEN = os.environ.get("OWNER_TOKEN", "ecsu-ark-owner-2024")


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def check_auth(headers: dict) -> bool:
    token = (headers.get("X-Owner-Token") or headers.get("x-owner-token") or
             headers.get("X-Authorization") or headers.get("x-authorization") or "")
    return token == OWNER_TOKEN


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def ark_log(cur, event: str, user: str, details: str, ip: str = ""):
    cur.execute(f"""
        INSERT INTO {S}.ark_logs (event, user_id, details, ip_address, created_at)
        VALUES (%s, %s, %s, %s, NOW())
    """, (event, user, details, ip))


def mock_ping():
    return random.randint(15, 180)


def mock_cpu():
    return round(random.uniform(5.0, 85.0), 1)


def mock_mem():
    return round(random.uniform(20.0, 90.0), 1)


def enrich_server(row: dict) -> dict:
    row["ping_ms"] = mock_ping()
    row["cpu_percent"] = mock_cpu()
    row["memory_percent"] = mock_mem()
    row["last_updated"] = now_iso()
    if row.get("is_active"):
        if row["cpu_percent"] > 80 or row["memory_percent"] > 85:
            row["status"] = "high_load"
        else:
            row["status"] = "online"
    else:
        row["status"] = "offline"
        row["ping_ms"] = 0
    return row


def handler(event: dict, context) -> dict:
    """ECSU 2.0 «Ковчег» — управление инфраструктурой системы для владельца."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    headers = event.get("headers") or {}
    params = event.get("queryStringParameters") or {}
    client_ip = (event.get("requestContext") or {}).get("identity", {}).get("sourceIp", "unknown")

    body = {}
    if event.get("body"):
        try:
            raw = event["body"]
            body = json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            pass

    # Auth check (пропускаем для GET /health)
    if not (method == "GET" and "/health" in path):
        if not check_auth(headers):
            return err("Нет доступа. Требуется токен владельца (X-Owner-Token).", 403)

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # ── GET /health ───────────────────────────────────────────────────────────
    if method == "GET" and "/health" in path:
        conn.close()
        return ok({"status": "ok", "module": "Ковчег", "system": "ECSU 2.0"})

    # ── GET /dashboard ────────────────────────────────────────────────────────
    if method == "GET" and ("/dashboard" in path or path in ("/", "")):
        cur.execute(f"SELECT * FROM {S}.ark_servers ORDER BY server_group, server_id")
        all_servers = [enrich_server(dict(r)) for r in cur.fetchall()]

        free_servers = [s for s in all_servers if s["server_group"] == "free"]
        premium_servers = [s for s in all_servers if s["server_group"] == "premium"]

        cur.execute(f"SELECT key, value FROM {S}.ark_settings")
        settings_rows = cur.fetchall()
        settings = {r["key"]: r["value"] for r in settings_rows}

        cur.execute(f"""
            SELECT * FROM {S}.ark_logs
            ORDER BY created_at DESC LIMIT 50
        """)
        logs = [dict(r) for r in cur.fetchall()]

        online_count = sum(1 for s in all_servers if s["status"] == "online")
        offline_count = sum(1 for s in all_servers if s["status"] == "offline")
        avg_ping = int(sum(s["ping_ms"] for s in all_servers if s["ping_ms"] > 0) / max(1, online_count))

        conn.close()
        return ok({
            "system_status": settings.get("system_mode", "online"),
            "default_settings": {
                "default_mode": settings.get("default_mode", "online"),
                "default_server_id": settings.get("default_server_id", ""),
                "auto_failover": settings.get("auto_failover", "true") == "true",
            },
            "server_groups": {
                "free": free_servers,
                "premium": premium_servers,
            },
            "all_servers": all_servers,
            "monitoring": {
                "total_servers": len(all_servers),
                "online_servers": online_count,
                "offline_servers": offline_count,
                "high_load_servers": sum(1 for s in all_servers if s["status"] == "high_load"),
                "avg_ping_ms": avg_ping,
            },
            "recent_logs": logs,
        })

    # ── POST /settings ────────────────────────────────────────────────────────
    if method == "POST" and "/settings" in path:
        system_mode = body.get("system_mode", "online")
        default_server_id = body.get("default_server_id", "")
        auto_failover = str(body.get("auto_failover", True)).lower()
        default_mode = body.get("default_mode", "online")

        for key, val in [
            ("system_mode", system_mode),
            ("default_server_id", default_server_id),
            ("auto_failover", auto_failover),
            ("default_mode", default_mode),
        ]:
            cur.execute(f"""
                INSERT INTO {S}.ark_settings (key, value, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
            """, (key, val))

        ark_log(cur, "settings_changed", "owner",
                f"Режим: {system_mode}, сервер: {default_server_id}, auto_failover: {auto_failover}",
                client_ip)
        conn.commit()
        conn.close()
        return ok({
            "status": "success",
            "message": "Глобальные настройки Ковчега применены",
            "applied": {"system_mode": system_mode, "default_server_id": default_server_id, "auto_failover": auto_failover},
        })

    # ── GET /servers ──────────────────────────────────────────────────────────
    if method == "GET" and "/servers" in path and "/servers/" not in path:
        group = params.get("group", "")
        if group:
            cur.execute(f"SELECT * FROM {S}.ark_servers WHERE server_group=%s ORDER BY server_id", (group,))
        else:
            cur.execute(f"SELECT * FROM {S}.ark_servers ORDER BY server_group, server_id")
        rows = [enrich_server(dict(r)) for r in cur.fetchall()]
        conn.close()
        return ok({"servers": rows, "total": len(rows)})

    # ── POST /servers — добавить сервер ───────────────────────────────────────
    if method == "POST" and path.endswith("/servers"):
        server_id = body.get("id", "").strip()
        name = body.get("name", "").strip()
        description = body.get("description", "")
        group = body.get("group", "free")
        url = body.get("url", "")
        active = bool(body.get("active", True))

        if not server_id or not name:
            conn.close()
            return err("Поля id и name обязательны")

        cur.execute(f"""
            INSERT INTO {S}.ark_servers
              (server_id, name, description, server_group, connection_url, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (server_id) DO UPDATE
              SET name=EXCLUDED.name, description=EXCLUDED.description,
                  server_group=EXCLUDED.server_group, connection_url=EXCLUDED.connection_url,
                  is_active=EXCLUDED.is_active
        """, (server_id, name, description, group, url, active))

        ark_log(cur, "server_added", "owner", f"Добавлен сервер {server_id} ({name}) в группу {group}", client_ip)
        conn.commit()
        conn.close()
        return ok({"status": "success", "message": f"Сервер {name} добавлен в группу {group}", "server_id": server_id}, 201)

    # ── PUT /servers/{id} — обновить сервер ───────────────────────────────────
    if method == "PUT" and "/servers/" in path:
        sid = path.split("/servers/")[-1].strip("/")
        name = body.get("name")
        description = body.get("description")
        group = body.get("group")
        url = body.get("url")
        active = body.get("active")

        sets, vals = [], []
        if name is not None: sets.append("name=%s"); vals.append(name)
        if description is not None: sets.append("description=%s"); vals.append(description)
        if group is not None: sets.append("server_group=%s"); vals.append(group)
        if url is not None: sets.append("connection_url=%s"); vals.append(url)
        if active is not None: sets.append("is_active=%s"); vals.append(bool(active))

        if not sets:
            conn.close()
            return err("Нет полей для обновления")

        vals.append(sid)
        cur.execute(f"UPDATE {S}.ark_servers SET {', '.join(sets)} WHERE server_id=%s", vals)
        ark_log(cur, "server_updated", "owner", f"Обновлён сервер {sid}: {', '.join(sets)}", client_ip)
        conn.commit()
        conn.close()
        return ok({"status": "success", "message": f"Сервер {sid} обновлён"})

    # ── DELETE /servers/{id} ──────────────────────────────────────────────────
    if method == "DELETE" and "/servers/" in path:
        sid = path.split("/servers/")[-1].strip("/")
        cur.execute(f"DELETE FROM {S}.ark_servers WHERE server_id=%s", (sid,))
        ark_log(cur, "server_deleted", "owner", f"Удалён сервер {sid}", client_ip)
        conn.commit()
        conn.close()
        return ok({"status": "success", "message": f"Сервер {sid} удалён"})

    # ── POST /servers/{id}/restart ────────────────────────────────────────────
    if method == "POST" and "/restart" in path:
        sid = path.split("/servers/")[-1].split("/restart")[0].strip("/")
        cur.execute(f"UPDATE {S}.ark_servers SET is_active=true WHERE server_id=%s", (sid,))
        ark_log(cur, "server_restarted", "owner", f"Перезагружен сервер {sid}", client_ip)
        conn.commit()
        conn.close()
        return ok({"status": "success", "message": f"Сервер {sid} перезагружен", "server_id": sid})

    # ── POST /servers/{id}/shutdown ───────────────────────────────────────────
    if method == "POST" and "/shutdown" in path:
        sid = path.split("/servers/")[-1].split("/shutdown")[0].strip("/")
        cur.execute(f"UPDATE {S}.ark_servers SET is_active=false WHERE server_id=%s", (sid,))
        ark_log(cur, "server_shutdown", "owner", f"Остановлен сервер {sid}", client_ip)
        conn.commit()
        conn.close()
        return ok({"status": "success", "message": f"Сервер {sid} остановлен", "server_id": sid})

    # ── GET /logs ─────────────────────────────────────────────────────────────
    if method == "GET" and "/logs" in path:
        limit = int(params.get("limit", 100))
        cur.execute(f"SELECT * FROM {S}.ark_logs ORDER BY created_at DESC LIMIT %s", (limit,))
        logs = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"logs": logs, "total": len(logs)})

    conn.close()
    return err("Маршрут не найден", 404)
