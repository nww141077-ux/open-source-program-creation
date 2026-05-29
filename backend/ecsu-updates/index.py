"""
ECSU App Updates — управление обновлениями, снапшотами и откатом.
Сайт создаёт обновления/снапшоты → ПК-агент забирает и применяет/откатывает.
"""
import json
import os
import sys
from datetime import datetime, timezone
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Agent-Id",
}


def resp(code: int, body: dict) -> dict:
    return {"statusCode": code, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Управление обновлениями, снапшотами и откатом ECSU."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs     = event.get("queryStringParameters") or {}
    action = qs.get("action", "")

    conn = get_conn()
    cur  = conn.cursor()

    try:

        # ════════════════════════════════════════════════════════════
        #  GET  /?action=files  — список файлов для доставки на ПК
        # ════════════════════════════════════════════════════════════
        if method == "GET" and action == "files":
            cur.execute("""
                SELECT f.id, f.filename, f.description, f.file_type,
                       f.dest_path, f.size_bytes, f.created_by, f.created_at, f.status,
                       COUNT(l.id) AS delivered_count
                FROM ecsu_delivery_files f
                LEFT JOIN ecsu_delivery_log l ON l.file_id = f.id
                WHERE f.status != 'deleted'
                GROUP BY f.id
                ORDER BY f.created_at DESC
                LIMIT 100
            """)
            rows = cur.fetchall()
            files = [{
                "id": r[0], "filename": r[1], "description": r[2],
                "file_type": r[3], "dest_path": r[4],
                "size_bytes": r[5], "created_by": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
                "status": r[8], "delivered_count": r[9],
            } for r in rows]
            return resp(200, {"files": files, "total": len(files)})

        # ════════════════════════════════════════════════════════════
        #  GET  /?action=files_pending&agent_id=XXX — файлы для агента
        # ════════════════════════════════════════════════════════════
        if method == "GET" and action == "files_pending":
            agent_id = qs.get("agent_id", "")
            cur.execute("""
                SELECT id, filename, description, file_type,
                       content_b64, dest_path, size_bytes, created_at
                FROM ecsu_delivery_files
                WHERE status = 'active'
                  AND id NOT IN (
                      SELECT file_id FROM ecsu_delivery_log WHERE agent_id = %s
                  )
                ORDER BY created_at ASC
            """, (agent_id,))
            rows = cur.fetchall()
            files = [{
                "id": r[0], "filename": r[1], "description": r[2],
                "file_type": r[3], "content_b64": r[4] or "",
                "dest_path": r[5], "size_bytes": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
            } for r in rows]
            return resp(200, {"files": files, "count": len(files)})

        # ════════════════════════════════════════════════════════════
        #  GET  /?action=snapshots  — список снапшотов
        # ════════════════════════════════════════════════════════════
        if method == "GET" and action == "snapshots":
            cur.execute("""
                SELECT s.id, s.name, s.description, s.snapshot_type,
                       s.created_by, s.created_at, s.is_active, s.tag, s.size_kb,
                       COUNT(r.id) AS rollback_count
                FROM ecsu_snapshots s
                LEFT JOIN ecsu_rollback_log r ON r.snapshot_id = s.id
                GROUP BY s.id
                ORDER BY s.created_at DESC
                LIMIT 50
            """)
            rows = cur.fetchall()
            snapshots = [{
                "id": r[0], "name": r[1], "description": r[2],
                "snapshot_type": r[3], "created_by": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
                "is_active": r[6], "tag": r[7], "size_kb": r[8],
                "rollback_count": r[9],
            } for r in rows]
            return resp(200, {"snapshots": snapshots, "total": len(snapshots)})

        # ════════════════════════════════════════════════════════════
        #  GET  /?action=pending&agent_id=XXX — обновления для агента
        # ════════════════════════════════════════════════════════════
        if method == "GET" and action == "pending":
            agent_id = qs.get("agent_id", "")
            cur.execute("""
                SELECT u.id, u.version, u.title, u.description, u.update_type,
                       u.payload, u.files, u.created_at
                FROM ecsu_app_updates u
                WHERE u.status = 'active'
                  AND u.id NOT IN (
                      SELECT update_id FROM ecsu_update_log WHERE agent_id = %s
                  )
                ORDER BY u.created_at ASC
            """, (agent_id,))
            rows = cur.fetchall()
            updates = [{
                "id": r[0], "version": r[1], "title": r[2],
                "description": r[3], "update_type": r[4],
                "payload": r[5] or {}, "files": r[6] or [],
                "created_at": r[7].isoformat() if r[7] else None,
            } for r in rows]
            return resp(200, {"pending": updates, "count": len(updates), "agent_id": agent_id})

        # ════════════════════════════════════════════════════════════
        #  GET  /?action=rollback_target&agent_id=XXX
        #  Агент проверяет: есть ли команда отката
        # ════════════════════════════════════════════════════════════
        if method == "GET" and action == "rollback_target":
            agent_id = qs.get("agent_id", "")
            cur.execute("""
                SELECT s.id, s.name, s.description, s.snapshot_type,
                       s.state, s.created_at, s.tag
                FROM ecsu_snapshots s
                WHERE s.snapshot_type = 'rollback_command'
                  AND s.is_active = TRUE
                  AND s.id NOT IN (
                      SELECT snapshot_id FROM ecsu_rollback_log WHERE agent_id = %s
                  )
                ORDER BY s.created_at DESC
                LIMIT 1
            """, (agent_id,))
            row = cur.fetchone()
            if row:
                return resp(200, {
                    "has_rollback": True,
                    "snapshot": {
                        "id": row[0], "name": row[1], "description": row[2],
                        "snapshot_type": row[3], "state": row[4] or {},
                        "created_at": row[5].isoformat() if row[5] else None,
                        "tag": row[6],
                    }
                })
            return resp(200, {"has_rollback": False})

        # ════════════════════════════════════════════════════════════
        #  GET  /  — список обновлений (для сайта)
        # ════════════════════════════════════════════════════════════
        if method == "GET":
            cur.execute("""
                SELECT u.id, u.version, u.title, u.description, u.update_type,
                       u.payload, u.files, u.created_by, u.created_at, u.status,
                       COUNT(l.id) AS applied_count
                FROM ecsu_app_updates u
                LEFT JOIN ecsu_update_log l ON l.update_id = u.id
                GROUP BY u.id
                ORDER BY u.created_at DESC
                LIMIT 100
            """)
            rows = cur.fetchall()
            updates = [{
                "id": r[0], "version": r[1], "title": r[2],
                "description": r[3], "update_type": r[4],
                "payload": r[5] or {}, "files": r[6] or [],
                "created_by": r[7],
                "created_at": r[8].isoformat() if r[8] else None,
                "status": r[9], "applied_count": r[10],
            } for r in rows]
            return resp(200, {"updates": updates, "total": len(updates)})

        # ════════════════════════════════════════════════════════════
        #  POST /  — создание (обновления, снапшота, откат-команды)
        # ════════════════════════════════════════════════════════════
        if method == "POST":
            body       = json.loads(event.get("body") or "{}")
            post_action = body.get("action", "create")

            # ── Загрузить файл для доставки на ПК ────────────────
            if post_action == "upload_file":
                filename    = body.get("filename", "file.txt")
                description = body.get("description", "")
                file_type   = body.get("file_type", "document")
                content_b64 = body.get("content_b64", "")
                dest_path   = body.get("dest_path", "")
                created_by  = body.get("created_by", "admin")
                size_bytes  = len(content_b64.encode()) * 3 // 4

                cur.execute("""
                    INSERT INTO ecsu_delivery_files
                        (filename, description, file_type, content_b64,
                         dest_path, size_bytes, created_by)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (filename, description, file_type, content_b64,
                      dest_path, size_bytes, created_by))
                new_id = cur.fetchone()[0]
                conn.commit()
                return resp(200, {"ok": True, "id": new_id, "size_bytes": size_bytes})

            # ── Агент подтверждает получение файла ────────────────
            if post_action == "file_received":
                agent_id = body.get("agent_id", "")
                hostname = body.get("hostname", "")
                file_ids = body.get("file_ids", [])
                for fid in file_ids:
                    cur.execute("""
                        INSERT INTO ecsu_delivery_log (file_id, agent_id, hostname)
                        VALUES (%s, %s, %s)
                    """, (fid, agent_id, hostname))
                conn.commit()
                return resp(200, {"ok": True, "recorded": len(file_ids)})

            # ── Агент подтверждает применение обновлений ──────────
            if post_action == "applied":
                agent_id   = body.get("agent_id", "")
                hostname   = body.get("hostname", "")
                update_ids = body.get("update_ids", [])
                result     = body.get("result", "ok")
                for uid in update_ids:
                    cur.execute("""
                        INSERT INTO ecsu_update_log (update_id, agent_id, hostname, result)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT DO NOTHING
                    """, (uid, agent_id, hostname, result))
                conn.commit()
                return resp(200, {"ok": True, "recorded": len(update_ids)})

            # ── Агент подтверждает откат ───────────────────────────
            if post_action == "rollback_done":
                agent_id    = body.get("agent_id", "")
                hostname    = body.get("hostname", "")
                snapshot_id = body.get("snapshot_id")
                result      = body.get("result", "ok")
                cur.execute("""
                    INSERT INTO ecsu_rollback_log (snapshot_id, agent_id, rolled_by, result)
                    VALUES (%s, %s, %s, %s)
                """, (snapshot_id, agent_id, hostname, result))
                conn.commit()
                return resp(200, {"ok": True})

            # ── Создать снапшот ────────────────────────────────────
            if post_action == "snapshot":
                name          = body.get("name", "Снапшот " + datetime.now().strftime("%d.%m.%Y %H:%M"))
                description   = body.get("description", "")
                snapshot_type = body.get("snapshot_type", "manual")
                state         = body.get("state", {})
                tag           = body.get("tag", "")
                created_by    = body.get("created_by", "admin")
                state_str     = json.dumps(state, ensure_ascii=False)
                size_kb       = len(state_str.encode()) // 1024

                cur.execute("""
                    INSERT INTO ecsu_snapshots
                        (name, description, snapshot_type, state, tag, created_by, size_kb)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (name, description, snapshot_type, state_str, tag, created_by, size_kb))
                new_id = cur.fetchone()[0]
                conn.commit()
                return resp(200, {"ok": True, "id": new_id})

            # ── Команда отката к снапшоту ──────────────────────────
            if post_action == "rollback":
                snapshot_id = body.get("snapshot_id")
                reason      = body.get("reason", "")
                rolled_by   = body.get("rolled_by", "admin")

                # Получаем снапшот
                cur.execute("SELECT id, name, state FROM ecsu_snapshots WHERE id = %s", (snapshot_id,))
                row = cur.fetchone()
                if not row:
                    return resp(404, {"error": "Снапшот не найден"})

                # Создаём специальную запись в снапшотах — команда для агентов
                state_data = row[2] or {}
                cur.execute("""
                    INSERT INTO ecsu_snapshots
                        (name, description, snapshot_type, state, tag, created_by)
                    VALUES (%s, %s, 'rollback_command', %s, %s, %s)
                    RETURNING id
                """, (
                    f"Откат к: {row[1]}",
                    reason,
                    json.dumps(state_data, ensure_ascii=False),
                    f"rollback_to_{snapshot_id}",
                    rolled_by,
                ))
                cmd_id = cur.fetchone()[0]

                # Логируем инициацию отката
                cur.execute("""
                    INSERT INTO ecsu_rollback_log (snapshot_id, rolled_by, reason)
                    VALUES (%s, %s, %s)
                """, (snapshot_id, rolled_by, reason or f"Инициировано с сайта"))
                conn.commit()
                return resp(200, {"ok": True, "command_id": cmd_id, "target_snapshot": snapshot_id})

            # ── Создать обновление (action=create или по умолчанию) ─
            title       = body.get("title", "")
            if not title:
                return resp(400, {"error": "title required"})

            version     = body.get("version", "")
            description = body.get("description", "")
            update_type = body.get("update_type", "patch")
            payload     = body.get("payload", {})
            files       = body.get("files", [])
            created_by  = body.get("created_by", "admin")
            status      = body.get("status", "active")

            cur.execute("""
                INSERT INTO ecsu_app_updates
                    (version, title, description, update_type, payload, files, created_by, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (version, title, description, update_type,
                  json.dumps(payload), json.dumps(files), created_by, status))
            new_id = cur.fetchone()[0]
            conn.commit()
            return resp(200, {"ok": True, "id": new_id})

        # ════════════════════════════════════════════════════════════
        #  PUT /  — изменить статус обновления или снапшота
        # ════════════════════════════════════════════════════════════
        if method == "PUT":
            body     = json.loads(event.get("body") or "{}")
            put_type = body.get("type", "update")

            if put_type == "snapshot":
                cur.execute("UPDATE ecsu_snapshots SET is_active = %s WHERE id = %s",
                            (body.get("is_active", True), body.get("id")))
            else:
                cur.execute("UPDATE ecsu_app_updates SET status = %s WHERE id = %s",
                            (body.get("status", "active"), body.get("id")))
            conn.commit()
            return resp(200, {"ok": True})

        # ════════════════════════════════════════════════════════════
        #  DELETE /  — удалить обновление или снапшот
        # ════════════════════════════════════════════════════════════
        if method == "DELETE":
            body     = json.loads(event.get("body") or "{}")
            del_type = body.get("type", "update")

            if del_type == "snapshot":
                sid = body.get("id")
                cur.execute("DELETE FROM ecsu_rollback_log WHERE snapshot_id = %s", (sid,))
                cur.execute("DELETE FROM ecsu_snapshots WHERE id = %s", (sid,))
            elif del_type == "file":
                fid = body.get("id")
                cur.execute("UPDATE ecsu_delivery_files SET status = 'deleted' WHERE id = %s", (fid,))
            else:
                uid = body.get("id")
                cur.execute("DELETE FROM ecsu_update_log WHERE update_id = %s", (uid,))
                cur.execute("DELETE FROM ecsu_app_updates WHERE id = %s", (uid,))
            conn.commit()
            return resp(200, {"ok": True})

    finally:
        cur.close()
        conn.close()

    return resp(404, {"error": "not found"})