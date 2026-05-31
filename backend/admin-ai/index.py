"""
ИИ-ассистент администратора системы ECSU DALAN v2.
Понимает команды на русском языке и управляет настройками, модулями, резервными копиями и конфигурацией Dalan.
"""
import json
import os
import psycopg2
import urllib.request
import urllib.error
from datetime import datetime

SCHEMA = "t_p38294978_open_source_program_"
OPENROUTER_KEY = (os.environ.get("OPENROUTER_API_KEY") or "").strip()

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_system_state():
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT key, value, category FROM {SCHEMA}.app_settings ORDER BY category, key")
        settings = [{"key": r[0], "value": r[1], "category": r[2]} for r in cur.fetchall()]

        cur.execute(f"SELECT name, label, enabled FROM {SCHEMA}.app_modules ORDER BY id")
        modules = [{"name": r[0], "label": r[1], "enabled": r[2]} for r in cur.fetchall()]

        cur.execute(f"SELECT param_key, param_value, param_label FROM {SCHEMA}.dalan_config ORDER BY id")
        dalan = [{"key": r[0], "value": r[1], "label": r[2]} for r in cur.fetchall()]

        cur.execute(f"SELECT id, label, created_at FROM {SCHEMA}.admin_backups ORDER BY created_at DESC LIMIT 5")
        backups = [{"id": r[0], "label": r[1], "created_at": r[2].isoformat() if r[2] else None} for r in cur.fetchall()]

        return {"settings": settings, "modules": modules, "dalan": dalan, "backups": backups}
    finally:
        cur.close()
        conn.close()

def execute_action(action: dict) -> str:
    conn = get_conn()
    cur = conn.cursor()
    try:
        atype = action.get("type")

        if atype == "save_setting":
            cur.execute(f"UPDATE {SCHEMA}.app_settings SET value=%s, updated_at=now() WHERE key=%s", (action["value"], action["key"]))
            conn.commit()
            return f"Настройка '{action['key']}' изменена на '{action['value']}'"

        if atype == "toggle_module":
            cur.execute(f"UPDATE {SCHEMA}.app_modules SET enabled=%s, updated_at=now() WHERE name=%s", (action["enabled"], action["name"]))
            conn.commit()
            state = "включён" if action["enabled"] else "выключен"
            return f"Модуль '{action['name']}' {state}"

        if atype == "save_dalan":
            cur.execute(f"UPDATE {SCHEMA}.dalan_config SET param_value=%s, updated_at=now() WHERE param_key=%s", (action["value"], action["key"]))
            conn.commit()
            return f"Параметр Dalan '{action['key']}' изменён на '{action['value']}'"

        if atype == "create_backup":
            label = action.get("label", f"Авто-точка {datetime.now().strftime('%d.%m.%Y %H:%M')}")
            cur.execute(f"SELECT key, value, category, label FROM {SCHEMA}.app_settings")
            settings = [{"key": r[0], "value": r[1], "category": r[2], "label": r[3]} for r in cur.fetchall()]
            cur.execute(f"SELECT id, name, label, enabled FROM {SCHEMA}.app_modules")
            modules = [{"id": r[0], "name": r[1], "label": r[2], "enabled": r[3]} for r in cur.fetchall()]
            cur.execute(f"SELECT param_key, param_value, param_label, param_type FROM {SCHEMA}.dalan_config")
            dalan = [{"key": r[0], "value": r[1], "label": r[2], "type": r[3]} for r in cur.fetchall()]
            cur.execute(
                f"INSERT INTO {SCHEMA}.admin_backups (label, settings_json, modules_json, dalan_config_json, modules_count, note) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                (label, json.dumps(settings), json.dumps(modules), json.dumps(dalan), len(modules), action.get("note", "Создано ИИ-ассистентом"))
            )
            backup_id = cur.fetchone()[0]
            conn.commit()
            return f"Точка восстановления '{label}' создана (ID: {backup_id})"

        if atype == "restore_backup":
            cur.execute(f"SELECT settings_json, modules_json, dalan_config_json, label FROM {SCHEMA}.admin_backups WHERE id=%s", (action["id"],))
            row = cur.fetchone()
            if not row:
                return "Точка восстановления не найдена"
            for s in json.loads(row[0]):
                cur.execute(f"UPDATE {SCHEMA}.app_settings SET value=%s, updated_at=now() WHERE key=%s", (s["value"], s["key"]))
            for m in json.loads(row[1]):
                cur.execute(f"UPDATE {SCHEMA}.app_modules SET enabled=%s, updated_at=now() WHERE name=%s", (m["enabled"], m["name"]))
            for d in json.loads(row[2] or "[]"):
                cur.execute(f"UPDATE {SCHEMA}.dalan_config SET param_value=%s, updated_at=now() WHERE param_key=%s", (d["value"], d["key"]))
            conn.commit()
            return f"Система восстановлена из точки '{row[3]}'"

        return "Неизвестное действие"
    finally:
        cur.close()
        conn.close()

def call_ai(messages: list, system_state: dict) -> str:
    system_prompt = f"""Ты — автономный ИИ-ассистент администратора системы ECSU DALAN.
Ты управляешь системой через JSON-команды. Отвечай ТОЛЬКО на русском языке.

ТЕКУЩЕЕ СОСТОЯНИЕ СИСТЕМЫ:
{json.dumps(system_state, ensure_ascii=False, indent=2)}

Ты можешь выполнять действия. Если пользователь просит что-то изменить — верни JSON-действие в конце ответа в блоке:
<action>{{"type": "...", ...}}</action>

Доступные действия:
- save_setting: {{"type": "save_setting", "key": "...", "value": "..."}}
- toggle_module: {{"type": "toggle_module", "name": "...", "enabled": true/false}}
- save_dalan: {{"type": "save_dalan", "key": "...", "value": "..."}}
- create_backup: {{"type": "create_backup", "label": "...", "note": "..."}}
- restore_backup: {{"type": "restore_backup", "id": 123}}

Если просто вопрос — отвечай без блока action.
Будь краток и конкретен. Перечисляй текущие значения когда нужно."""

    payload = json.dumps({
        "model": "openai/gpt-4o-mini",
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "temperature": 0.4,
        "max_tokens": 1000,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://poehali.dev",
            "X-Title": "ECSU DALAN Admin",
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    return result["choices"][0]["message"]["content"]

def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    body = json.loads(event.get("body") or "{}")
    messages = body.get("messages", [])

    if not messages:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "messages required"})}

    system_state = get_system_state()
    ai_response = call_ai(messages, system_state)

    action_result = None
    if "<action>" in ai_response and "</action>" in ai_response:
        start = ai_response.index("<action>") + len("<action>")
        end = ai_response.index("</action>")
        action_json = ai_response[start:end].strip()
        clean_response = (ai_response[:ai_response.index("<action>")] + ai_response[end + len("</action>"):]).strip()
        try:
            action = json.loads(action_json)
            action_result = execute_action(action)
            ai_response = clean_response
        except Exception as e:
            action_result = f"Ошибка действия: {e}"

    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "reply": ai_response,
            "action_result": action_result,
        }, ensure_ascii=False)
    }