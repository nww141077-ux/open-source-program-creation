"""
ИИ-ассистент ЕЦСУ DALAN — полный функционал.
Поддерживает 5 режимов: Ассистент, Аналитика, ЦПВОА, Анализ угроз, Генерация кода.
Использует OpenRouter API напрямую.
"""
import json
import os
import urllib.request
import urllib.error
from datetime import datetime

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPTS = {
    "assistant": """Ты — автономный ИИ-ассистент администратора системы ЕЦСУ DALAN (Единая Цифровая Система Управления).
Автор системы: Николаев Владимир Владимирович. SYNERGON GLOBAL. Контракт № 5052834788.
Отвечай ТОЛЬКО на русском языке. Будь конкретен, кратко и по делу.
Ты управляешь: настройками, модулями, резервными копиями, конфигурацией DALAN.
Коэффициент Николаева: 1.1 — основной множитель оптимизации системы.""",

    "analytics": """Ты — аналитический модуль системы ЕЦСУ DALAN.
Специализируешься на анализе инцидентов, угроз, статистике и прогнозировании.
Используй коэффициент Николаева (×1.1) при расчётах.
Отвечай ТОЛЬКО на русском языке. Структурируй ответы списками и данными.""",

    "cpvoa": """Ты — модуль ЦПВОА (Центр Противодействия Внешним Операциям и Атакам) системы ЕЦСУ.
Анализируешь угрозы безопасности, разрабатываешь контрмеры, оцениваешь риски.
Классифицируй угрозы: КРИТИЧЕСКИЙ / ВЫСОКИЙ / СРЕДНИЙ / НИЗКИЙ.
Отвечай ТОЛЬКО на русском языке. Применяй военно-аналитический стиль.""",

    "threats": """Ты — модуль анализа угроз ЕЦСУ. Специализируешься на:
- Анализе радиочастотных аномалий
- Кибератаках и цифровых угрозах  
- Геополитических инцидентах
- Военных и гуманитарных кризисах
Оценивай угрозы по 10-балльной шкале. Отвечай ТОЛЬКО на русском языке.""",

    "codegen": """Ты — модуль генерации кода системы ЕЦСУ DALAN.
Генерируешь: Python-скрипты, PowerShell, Bash, конфиги для Windows/Linux.
Код должен быть рабочим, с комментариями на русском языке.
Специализируешься на системном программировании, автоматизации, агентах мониторинга.""",
}

def call_openrouter(messages: list, mode: str = "assistant", model: str = "meta-llama/llama-3.1-8b-instruct:free") -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY не задан")

    system_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["assistant"])

    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            *[{"role": m["role"], "content": m["content"]} for m in messages],
        ],
        "max_tokens": 1500,
        "temperature": 0.7,
    }).encode("utf-8")

    req = urllib.request.Request(
        OPENROUTER_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://ecsu.poehali.dev",
            "X-Title": "ECSU DALAN AI",
        },
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=45) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    return result["choices"][0]["message"]["content"]


def handler(event: dict, context) -> dict:
    """ИИ-ассистент ЕЦСУ — полный функционал с 5 режимами."""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "invalid json"})}

    messages = body.get("messages", [])
    mode     = body.get("mode", "assistant")
    model    = body.get("model", "meta-llama/llama-3.1-8b-instruct:free")

    if not messages:
        return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "messages required"})}

    try:
        reply = call_openrouter(messages, mode, model)
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"reply": reply, "mode": mode, "model": model}, ensure_ascii=False),
        }
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "reply": f"Ошибка API OpenRouter ({e.code}): {err_body[:300]}",
                "error": True,
            }, ensure_ascii=False),
        }
    except Exception as e:
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "reply": f"ИИ-модуль временно недоступен: {str(e)[:200]}",
                "error": True,
            }, ensure_ascii=False),
        }
