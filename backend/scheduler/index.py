"""
Планировщик ЕЦСУ 2.0 — автосканирование инцидентов и безопасности.
POST /run — запускает задачи по расписанию.
"""
import json
import os
import urllib.request
import psycopg2
from datetime import datetime, timezone, timedelta

S = "t_p38294978_open_source_program_"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}
SCANNER_URL = "https://functions.poehali.dev/b3ae5ea9-0780-4337-b7b0-e19f144a63fb"
SECURITY_URL = "https://functions.poehali.dev/15640332-461b-47d1-b024-8fa25fb344ef"
SCAN_MIN = 60
SEC_MIN = 15


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def post_url(url, payload, timeout=25):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        result = json.loads(r.read())
    return json.loads(result) if isinstance(result, str) else result


def get_url(url, timeout=10):
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"}, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        result = json.loads(r.read())
    return json.loads(result) if isinstance(result, str) else result


def get_last(cur, task):
    try:
        cur.execute(f"SELECT created_at FROM {S}.egsu_system_log WHERE event_type=%s ORDER BY created_at DESC LIMIT 1", (f"sched_{task}",))
        row = cur.fetchone()
        return row[0].replace(tzinfo=timezone.utc) if row and row[0] else None
    except Exception:
        return None


def due(last, mins):
    if not last:
        return True
    return (datetime.now(timezone.utc) - last) >= timedelta(minutes=mins)


def log(cur, task, data):
    try:
        cur.execute(f"INSERT INTO {S}.egsu_system_log (event_type, source, message, data) VALUES (%s,'scheduler',%s,%s)",
                    (f"sched_{task}", f"Scheduler: {task}", json.dumps(data, default=str)))
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    """Планировщик ЕЦСУ — запуск сканирования по расписанию."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    if method == "GET":
        last_scan = get_last(cur, "incident_scan")
        last_sec = get_last(cur, "security_check")
        conn.close()
        return ok({
            "status": "active",
            "intervals": {"incident_scan_min": SCAN_MIN, "security_check_min": SEC_MIN},
            "last_runs": {
                "incident_scan": last_scan.isoformat() if last_scan else None,
                "security_check": last_sec.isoformat() if last_sec else None,
            },
            "due_now": {
                "incident_scan": due(last_scan, SCAN_MIN),
                "security_check": due(last_sec, SEC_MIN),
            },
        })

    if method == "POST" and ("/run" in path or path in ("/", "")):
        force = body.get("force", False)
        tasks = body.get("tasks", "all")
        results = {}
        last_scan = get_last(cur, "incident_scan")
        last_sec = get_last(cur, "security_check")

        if tasks in ("all", "scan") and (force or due(last_scan, SCAN_MIN)):
            try:
                r = post_url(SCANNER_URL, {"sources": "all"})
                results["incident_scan"] = {"status": "done", "created": r.get("created", 0), "total": r.get("total_scanned", 0)}
                log(cur, "incident_scan", results["incident_scan"])
            except Exception as e:
                results["incident_scan"] = {"status": "error", "error": str(e)}
        else:
            results["incident_scan"] = {"status": "skipped"}

        if tasks in ("all", "security") and (force or due(last_sec, SEC_MIN)):
            try:
                r = get_url(SECURITY_URL)
                results["security_check"] = {"status": "done", "critical": r.get("critical_events", 0), "balance": r.get("absorption_balance_usd", 0)}
                log(cur, "security_check", results["security_check"])
            except Exception as e:
                results["security_check"] = {"status": "error", "error": str(e)}
        else:
            results["security_check"] = {"status": "skipped"}

        conn.commit()
        conn.close()
        return ok({"status": "ok", "results": results, "run_at": datetime.now(timezone.utc).isoformat()})

    conn.close()
    return err("Not found", 404)
