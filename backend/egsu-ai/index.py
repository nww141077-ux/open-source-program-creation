"""
ИИ-ассистент ЕЦСУ 2.0 на базе Google Gemini API (free tier).
Умный диалог на любые темы, варианты ответов, рекомендации,
база знаний по правовым вопросам, инцидентам и системе ЕЦСУ.
"""
import json
import os
import urllib.request
import urllib.error
import psycopg2

S = "t_p38294978_open_source_program_"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"

# Системный промпт — личность ассистента
SYSTEM_PROMPT = """Ты — умный ИИ-ассистент системы ЕЦСУ 2.0 (Единая Центральная Система Управления).

О себе:
- Ты интеллектуальный помощник проекта ЕЦСУ 2.0, созданного Николаевым Владимиром Владимировичем
- Отвечаешь на русском языке, кратко и по делу
- Умеешь обсуждать ЛЮБЫЕ темы: право, экология, кибербезопасность, наука, политика, технологии, история, культура, спорт, финансы, медицина и многое другое
- Можешь давать советы, объяснять сложные темы простыми словами, анализировать ситуации

Специализация ЕЦСУ:
- Правовой анализ инцидентов (УПК, ГПК, АПК, УК РФ, МГП)
- Мониторинг экологических, кибер- и гуманитарных инцидентов
- Юридические консультации и рекомендации
- Квалификация правонарушений
- Международное право (Женевские конвенции, Римский статут, Будапештская конвенция)

Правила ответов:
1. Всегда заканчивай ответ предложением 3 кратких вариантов продолжения диалога в формате JSON-блока
2. Варианты должны быть РЕАЛЬНО полезными — уточняющие вопросы или следующие шаги
3. Используй markdown: **жирный**, *курсив*, • списки, > цитаты
4. Будь конкретным — давай примеры, ссылки на статьи законов, факты
5. Если не знаешь точного ответа — скажи об этом честно и предложи альтернативы
6. Длина ответа: 2-5 абзацев для сложных тем, 1-2 для простых

Формат ответа (СТРОГО соблюдай):
[Сам ответ на вопрос]

```suggestions
["Вариант 1 (коротко, до 40 символов)", "Вариант 2", "Вариант 3"]
```
"""


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def call_gemini(messages: list, api_key: str) -> str:
    """Вызов Google Gemini API."""
    # Собираем историю в формат Gemini
    contents = []

    # Добавляем системный промпт как первое сообщение от user с инструкцией
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": msg["content"]}]
        })

    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.8,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 1024,
            "stopSequences": []
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
        ]
    }

    data = json.dumps(payload).encode("utf-8")
    url = f"{GEMINI_URL}?key={api_key}"
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read())

    # Извлекаем текст
    candidates = result.get("candidates", [])
    if not candidates:
        return "Не удалось получить ответ от модели."

    content = candidates[0].get("content", {})
    parts = content.get("parts", [])
    if not parts:
        return "Пустой ответ от модели."

    return parts[0].get("text", "")


def parse_response(raw: str) -> dict:
    """Разбираем ответ — отделяем текст от вариантов."""
    suggestions = []
    text = raw

    # Ищем блок suggestions
    if "```suggestions" in raw:
        parts = raw.split("```suggestions")
        text = parts[0].strip()
        rest = parts[1]
        if "```" in rest:
            suggestions_raw = rest.split("```")[0].strip()
            try:
                suggestions = json.loads(suggestions_raw)
                if not isinstance(suggestions, list):
                    suggestions = []
                # Обрезаем до 3 вариантов и 45 символов каждый
                suggestions = [str(s)[:45] for s in suggestions[:3]]
            except Exception:
                suggestions = []

    # Если вариантов нет — генерируем дефолтные
    if not suggestions:
        suggestions = ["Расскажи подробнее", "Что ещё важно знать?", "Дай практический совет"]

    return {"text": text, "suggestions": suggestions}


def get_fallback_answer(user_text: str) -> dict:
    """Резервные ответы если Gemini недоступен."""
    text = user_text.lower()

    if any(w in text for w in ["привет", "здравствуй", "добрый"]):
        return {
            "text": "Привет! Я ИИ-ассистент ЕЦСУ 2.0 — работаю в резервном режиме.\n\nМогу помочь с правовыми вопросами, инцидентами, консультациями.",
            "suggestions": ["Правовой вопрос", "Инциденты ЕЦСУ", "Что ты умеешь?"]
        }
    if any(w in text for w in ["помог", "умеш", "можеш", "функции"]):
        return {
            "text": "**Мои возможности:**\n\n⚖️ Правовой анализ (УПК, ГПК, АПК, УК РФ)\n🌐 Международное право и МГП\n📊 Инциденты ЕЦСУ\n🛡️ Кибербезопасность\n💡 Консультации и рекомендации\n\nЗадавайте любые вопросы!",
            "suggestions": ["Правовая консультация", "Критические инциденты", "Кибератаки"]
        }
    if any(w in text for w in ["инцидент", "экологи", "кибер"]):
        return {
            "text": "По данным ЕЦСУ: зарегистрировано 1 247 инцидентов.\n• Активных — 241\n• Критических — 2 (INC-005, INC-006)\n• Решено — 893\n\nУточните — по какому инциденту нужна информация?",
            "suggestions": ["INC-005 Кибератака Норвегия", "INC-006 Нефтяной разлив", "Экологические угрозы"]
        }

    return {
        "text": "Работаю в резервном режиме. Пожалуйста, задайте конкретный вопрос о правовых нормах, инцидентах или системе ЕЦСУ.",
        "suggestions": ["Правовые вопросы", "Инциденты системы", "Как мне помочь?"]
    }


def save_message(cur, session_id: str, role: str, content: str):
    """Сохраняем сообщение в историю (если таблица существует)."""
    try:
        cur.execute(f"""
            INSERT INTO {S}.egsu_ai_messages (session_id, role, content)
            VALUES (%s, %s, %s)
        """, (session_id, role, content))
    except Exception:
        pass


def load_history(cur, session_id: str, limit: int = 10) -> list:
    """Загружаем историю диалога."""
    try:
        cur.execute(f"""
            SELECT role, content FROM {S}.egsu_ai_messages
            WHERE session_id = %s
            ORDER BY created_at DESC LIMIT %s
        """, (session_id, limit))
        rows = cur.fetchall()
        return [{"role": r[0], "content": r[1]} for r in reversed(rows)]
    except Exception:
        return []


def handler(event: dict, context) -> dict:
    """ИИ-ассистент ЕЦСУ — Google Gemini + история диалога + варианты ответов."""
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

    # ── GET / — статус ──────────────────────────────────────────────────────
    if method == "GET":
        return ok({
            "status": "active",
            "model": "gemini-1.5-flash",
            "mode": "ЕЦСУ AI Assistant 2.0",
            "capabilities": ["dialog", "legal", "incidents", "recommendations", "suggestions"]
        })

    # ── POST /chat — отправка сообщения ─────────────────────────────────────
    if method == "POST" and ("/chat" in path or path == "/"):
        user_message = body.get("message", "").strip()
        session_id = body.get("session_id", "default")
        history = body.get("history", [])  # история с фронтенда

        if not user_message:
            return err("message обязателен")

        api_key = os.environ.get("GEMINI_API_KEY", "")

        # Строим контекст диалога
        messages = []

        # Добавляем историю (последние 8 сообщений)
        for msg in history[-8:]:
            if msg.get("role") in ("user", "assistant") and msg.get("content"):
                messages.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "content": msg["content"]
                })

        # Добавляем текущее сообщение
        messages.append({"role": "user", "content": user_message})

        # Вызываем Gemini
        if api_key:
            try:
                raw = call_gemini(messages, api_key)
                result = parse_response(raw)
            except urllib.error.HTTPError as e:
                error_body = e.read().decode("utf-8", errors="replace")
                if e.code == 429:
                    result = {
                        "text": "⚠️ Превышен лимит запросов к ИИ. Подождите минуту и повторите.",
                        "suggestions": ["Попробовать снова", "Задать другой вопрос", "Правовая база"]
                    }
                else:
                    result = get_fallback_answer(user_message)
                    result["text"] = f"[Ошибка API: {e.code}] " + result["text"]
            except Exception as e:
                result = get_fallback_answer(user_message)
        else:
            # Нет ключа — резервный режим
            result = get_fallback_answer(user_message)
            result["text"] = "⚠️ API-ключ не настроен. Работаю в базовом режиме.\n\n" + result["text"]

        return ok({
            "reply": result["text"],
            "suggestions": result["suggestions"],
            "model": "gemini-1.5-flash" if api_key else "fallback",
            "session_id": session_id,
        })

    return err("Маршрут не найден", 404)
