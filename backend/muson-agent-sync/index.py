"""
ECSU Мусон-Агент — серверная часть.
Принимает данные от агента на ПК, хранит в БД, отдаёт на сайт.
Поддерживает автообновление: агент забирает очередь обновлений при каждом пинге.
"""
import json
import os
from datetime import datetime, timezone
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ensure_table(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS muson_agents (
            agent_id    TEXT PRIMARY KEY,
            hostname    TEXT,
            os          TEXT,
            cpu_percent REAL,
            ram_percent REAL,
            ram_total_gb REAL,
            disk_d      JSONB,
            muson_files JSONB,
            muson_count INT DEFAULT 0,
            last_seen   TIMESTAMPTZ DEFAULT NOW(),
            started_at  TEXT,
            status      TEXT DEFAULT 'online'
        )
    """)


def get_pending_updates(cur, agent_id: str) -> list:
    """Возвращает обновления, которые этот агент ещё не применил."""
    try:
        cur.execute("""
            SELECT u.id, u.version, u.title, u.description,
                   u.update_type, u.payload, u.files, u.created_at
            FROM ecsu_app_updates u
            WHERE u.status = 'active'
              AND u.id NOT IN (
                  SELECT update_id FROM ecsu_update_log WHERE agent_id = %s
              )
            ORDER BY u.created_at ASC
        """, (agent_id,))
        rows = cur.fetchall()
        result = []
        for r in rows:
            result.append({
                "id": r[0], "version": r[1], "title": r[2],
                "description": r[3], "update_type": r[4],
                "payload": r[5] or {}, "files": r[6] or [],
                "created_at": r[7].isoformat() if r[7] else None,
            })
        return result
    except Exception:
        return []


def handler(event: dict, context) -> dict:
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")
    path   = event.get("path", "/")
    qs     = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor()
    ensure_table(cur)
    conn.commit()

    # ── POST / — агент отправляет heartbeat + получает обновления ────────
    if method == "POST":
        body     = json.loads(event.get("body") or "{}")
        agent_id = body.get("agent_id", "unknown")
        pc       = body.get("pc", {})
        muson    = body.get("muson", {})

        cur.execute("""
            INSERT INTO muson_agents
                (agent_id, hostname, os, cpu_percent, ram_percent, ram_total_gb,
                 disk_d, muson_files, muson_count, last_seen, started_at, status)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW(),%s,'online')
            ON CONFLICT (agent_id) DO UPDATE SET
                hostname     = EXCLUDED.hostname,
                os           = EXCLUDED.os,
                cpu_percent  = EXCLUDED.cpu_percent,
                ram_percent  = EXCLUDED.ram_percent,
                ram_total_gb = EXCLUDED.ram_total_gb,
                disk_d       = EXCLUDED.disk_d,
                muson_files  = EXCLUDED.muson_files,
                muson_count  = EXCLUDED.muson_count,
                last_seen    = NOW(),
                started_at   = EXCLUDED.started_at,
                status       = 'online'
        """, (
            agent_id,
            pc.get("hostname", ""),
            pc.get("os", ""),
            pc.get("cpu_percent", 0),
            pc.get("ram_percent", 0),
            pc.get("ram_total_gb", 0),
            json.dumps(pc.get("disk_d", {})),
            json.dumps(muson.get("files", [])[:200]),
            muson.get("count", 0),
            pc.get("started_at", ""),
        ))
        conn.commit()

        # Возвращаем обновления которые агент ещё не применял
        pending = get_pending_updates(cur, agent_id)

        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({
                "ok": True,
                "agent_id": agent_id,
                "updates": pending,
                "updates_count": len(pending),
            }),
        }

    # ── GET /updates?agent_id=XXX — получить очередь обновлений ─────────
    if method == "GET" and path == "/updates":
        agent_id = qs.get("agent_id", "")
        pending  = get_pending_updates(cur, agent_id)
        cur.close(); conn.close()
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"pending": pending, "count": len(pending)}),
        }

    # ── GET / — сайт запрашивает список агентов ───────────────────────────
    cur.execute("""
        SELECT agent_id, hostname, os, cpu_percent, ram_percent, ram_total_gb,
               disk_d, muson_files, muson_count, last_seen, started_at, status
        FROM muson_agents
        ORDER BY last_seen DESC
    """)
    rows = cur.fetchall()
    now  = datetime.now(timezone.utc)

    agents = []
    for row in rows:
        last_seen = row[9]
        if last_seen and last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)
        diff_sec = int((now - last_seen).total_seconds()) if last_seen else 9999
        online = diff_sec < 90

        agents.append({
            "agent_id":      row[0],
            "hostname":      row[1],
            "os":            row[2],
            "cpu_percent":   row[3],
            "ram_percent":   row[4],
            "ram_total_gb":  row[5],
            "disk_d":        row[6],
            "muson_files":   row[7] or [],
            "muson_count":   row[8],
            "last_seen":     row[9].isoformat() if row[9] else None,
            "last_seen_sec": diff_sec,
            "started_at":    row[10],
            "status":        "online" if online else "offline",
        })

    cur.close()
    conn.close()
    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({"agents": agents, "total": len(agents)}),
    }
