"""
ИИ-ассистент ЕЗСУ 2.0 — мультипровайдерный: Gemini, OpenAI, Anthropic, YandexGPT.
Авто-выбор модели по контексту, поддержка ЦПВОА, история диалога, умные подсказки.
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

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
YANDEX_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"

SYSTEM_PROMPT = """Ты — ИИ-ассистент системы ЕЗСУ 2.0 (Единая Защитная Система Управления), интегрированный с модулем ЦПВОА.

О себе:
- Создан для проекта ЕЗСУ 2.0, автор — Николаев Владимир Владимирович
- Отвечаешь на русском языке, чётко и по существу
- Разбираешься в любых темах: право, экология, кибербезопасность, технологии, финансы, медицина
- Даёшь практичные советы, объясняешь сложное простыми словами

Специализация ЕЗСУ:
- Правовой анализ (УПК, ГПК, АПК, УК РФ, международное право)
- Мониторинг экологических, кибер- и гуманитарных инцидентов
- Юридические консультации, квалификация правонарушений
- МГП: Женевские конвенции, Римский статут, Будапештская конвенция

Модуль ЦПВОА (Центральная Платформа Всеканального Обнаружения Аномалий):
- Мониторинг аномалий в реальном времени: радиоэфир, оптика, меш-сети
- Уровни угроз: низкий → средний → высокий → критический
- При получении данных ЦПВОА: кратко резюмируй → анализируй каждый инцидент → правовая квалификация → рекомендации

Правила:
1. В конце каждого ответа — блок с 3 вариантами продолжения (JSON формат ниже)
2. Варианты — реальные следующие шаги, не общие фразы
3. Markdown: **жирный**, *курсив*, • списки, > цитаты, `код`
4. Конкретность: статьи законов, примеры, факты
5. Честность: если не знаешь — так и скажи
6. Длина: 1-2 абзаца для простых вопросов, 3-5 для сложных

Формат (строго):
[Ответ]

```suggestions
["Краткий вариант 1 (до 40 символов)", "Вариант 2", "Вариант 3"]
```"""


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def http_post(url: str, payload: dict, headers: dict, timeout: int = 28) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


# ── Провайдеры ────────────────────────────────────────────────────────────────

def call_gemini(messages: list, api_key: str, model: str = "gemini-1.5-flash-latest") -> str:
    """Google Gemini API."""
    contents = []
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.85,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 1500,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
        ]
    }
    url = GEMINI_URL.format(model=model) + f"?key={api_key}"
    result = http_post(url, payload, {"Content-Type": "application/json"})
    candidates = result.get("candidates", [])
    if not candidates:
        raise ValueError("Gemini: пустой список candidates")
    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        raise ValueError("Gemini: пустые parts")
    return parts[0].get("text", "")


def call_openai(messages: list, api_key: str, model: str = "gpt-4o") -> str:
    """OpenAI ChatGPT API."""
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    payload = {"model": model, "messages": msgs, "max_tokens": 1500, "temperature": 0.85}
    result = http_post(OPENAI_URL, payload, {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    })
    return result["choices"][0]["message"]["content"]


def call_anthropic(messages: list, api_key: str, model: str = "claude-3-5-sonnet-20241022") -> str:
    """Anthropic Claude API."""
    msgs = []
    for msg in messages:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    payload = {
        "model": model,
        "max_tokens": 1500,
        "system": SYSTEM_PROMPT,
        "messages": msgs
    }
    result = http_post(ANTHROPIC_URL, payload, {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01"
    })
    return result["content"][0]["text"]


def call_yandex(messages: list, api_key: str, model: str = "yandexgpt-lite") -> str:
    """YandexGPT API."""
    msgs = [{"role": "system", "text": SYSTEM_PROMPT}]
    for msg in messages:
        msgs.append({"role": msg["role"], "text": msg["content"]})
    payload = {
        "modelUri": f"gpt://{os.environ.get('YANDEX_FOLDER_ID', 'b1g')}/{model}",
        "completionOptions": {"stream": False, "temperature": 0.85, "maxTokens": "1500"},
        "messages": msgs
    }
    result = http_post(YANDEX_URL, payload, {
        "Content-Type": "application/json",
        "Authorization": f"Api-Key {api_key}"
    })
    return result["result"]["alternatives"][0]["message"]["text"]


def call_custom(messages: list, api_key: str, custom_url: str, model: str = "gpt-3.5-turbo") -> str:
    """OpenAI-совместимый кастомный эндпоинт."""
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    payload = {"model": model, "messages": msgs, "max_tokens": 1500, "temperature": 0.85}
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = api_key if api_key.startswith("Bearer") else f"Bearer {api_key}"
    result = http_post(custom_url, payload, headers)
    return result["choices"][0]["message"]["content"]


# ── Авто-выбор провайдера ─────────────────────────────────────────────────────

def auto_pick_provider(text: str, has_cpvoa: bool) -> str:
    """Выбираем лучший доступный провайдер под запрос."""
    lower = text.lower()
    # Предпочтения по типу запроса
    if has_cpvoa or any(w in lower for w in ["цпвоа", "аномал", "сигнал", "частот", "датчик"]):
        preferred = ["gemini", "openai", "anthropic"]
    elif any(w in lower for w in ["документ", "контракт", "договор", "анализ текст", "составь"]):
        preferred = ["anthropic", "gemini", "openai"]
    elif any(w in lower for w in ["код", "программ", "api", "json", "python", "javascript"]):
        preferred = ["openai", "anthropic", "gemini"]
    elif any(w in lower for w in ["право", "закон", "упк", "мгп", "судеб", "иск"]):
        preferred = ["gemini", "yandex", "anthropic"]
    else:
        preferred = ["gemini", "openai", "anthropic", "yandex"]

    # Выбираем первый доступный (YANDEX_SPEECHKIT — это SpeechKit, не GPT, не используем)
    available = {
        "gemini": bool(os.environ.get("GEMINI_API_KEY")),
        "openai": bool(os.environ.get("OPENAI_API_KEY")),
        "anthropic": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "yandex": bool(os.environ.get("YANDEX_GPT_API_KEY")),
    }
    for p in preferred:
        if available.get(p):
            return p
    return "fallback"


def dispatch_call(provider: str, messages: list, client_key: str, model: str, custom_url: str) -> str:
    """Вызов нужного провайдера с приоритетом клиентского ключа над серверным."""
    if provider == "gemini":
        key = client_key or os.environ.get("GEMINI_API_KEY", "")
        m = model or "gemini-1.5-flash-latest"
        return call_gemini(messages, key, m)
    if provider == "openai":
        key = client_key or os.environ.get("OPENAI_API_KEY", "")
        m = model or "gpt-4o"
        return call_openai(messages, key, m)
    if provider == "anthropic":
        key = client_key or os.environ.get("ANTHROPIC_API_KEY", "")
        m = model or "claude-3-5-sonnet-20241022"
        return call_anthropic(messages, key, m)
    if provider == "yandex":
        key = client_key or os.environ.get("YANDEX_SPEECHKIT_API_KEY", "")
        m = model or "yandexgpt-lite"
        return call_yandex(messages, key, m)
    if provider == "custom" and custom_url:
        return call_custom(messages, client_key, custom_url, model or "gpt-3.5-turbo")
    raise ValueError(f"Провайдер не найден: {provider}")


# ── Парсинг ответа ────────────────────────────────────────────────────────────

def parse_response(raw: str) -> dict:
    suggestions = []
    text = raw.strip()
    if "```suggestions" in raw:
        parts = raw.split("```suggestions")
        text = parts[0].strip()
        rest = parts[1]
        if "```" in rest:
            raw_s = rest.split("```")[0].strip()
            try:
                parsed = json.loads(raw_s)
                if isinstance(parsed, list):
                    suggestions = [str(s)[:45] for s in parsed[:3]]
            except Exception:
                pass
    if not suggestions:
        suggestions = ["Расскажи подробнее", "Что ещё важно?", "Практический пример"]
    return {"text": text, "suggestions": suggestions}


def fallback_answer(user_text: str) -> dict:
    lower = user_text.lower()
    if any(w in lower for w in ["привет", "здравствуй", "добрый"]):
        return {"text": "Привет! Я ИИ-ассистент **ЕЗСУ 2.0**.\n\nМогу помочь с правовыми вопросами, анализом инцидентов и мониторингом ЦПВОА.", "suggestions": ["Что ты умеешь?", "Инциденты ЕЗСУ", "Подключить ЦПВОА"]}
    if any(w in lower for w in ["умеешь", "можешь", "функции", "помог"]):
        return {"text": "**Мои возможности:**\n\n⚖️ Правовой анализ (УПК, ГПК, УК РФ, МГП)\n🌐 Международное право\n📡 Анализ данных ЦПВОА\n🛡️ Кибербезопасность\n💡 Консультации и рекомендации", "suggestions": ["Правовая консультация", "Критические инциденты", "ЦПВОА: статус"]}
    return {"text": "⚠️ ИИ временно недоступен. Работаю в базовом режиме.\n\nЗадайте вопрос о праве, инцидентах или системе ЕЗСУ.", "suggestions": ["Правовые вопросы", "Инциденты системы", "Попробовать снова"]}


# ── Сохранение истории ────────────────────────────────────────────────────────

def save_message(cur, session_id: str, role: str, content: str):
    try:
        cur.execute(f"INSERT INTO {S}.egsu_ai_messages (session_id, role, content) VALUES (%s, %s, %s)", (session_id, role, content))
    except Exception:
        pass


def load_history(cur, session_id: str, limit: int = 10) -> list:
    try:
        cur.execute(f"SELECT role, content FROM {S}.egsu_ai_messages WHERE session_id = %s ORDER BY created_at DESC LIMIT %s", (session_id, limit))
        return [{"role": r[0], "content": r[1]} for r in reversed(cur.fetchall())]
    except Exception:
        return []


# ── Handler ───────────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """ИИ-ассистент ЕЗСУ 2.0 — Gemini / OpenAI / Anthropic / YandexGPT с авто-выбором."""
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

    if method == "GET":
        available = {
            "gemini": bool(os.environ.get("GEMINI_API_KEY")),
            "openai": bool(os.environ.get("OPENAI_API_KEY")),
            "anthropic": bool(os.environ.get("ANTHROPIC_API_KEY")),
            "yandex": bool(os.environ.get("YANDEX_SPEECHKIT_API_KEY")),
        }
        return ok({
            "status": "active",
            "version": "ЕЗСУ AI 2.0",
            "providers": available,
            "capabilities": ["dialog", "legal", "cpvoa", "incidents", "multi-provider"]
        })

    if method == "POST" and ("/chat" in path or path == "/"):
        user_message = body.get("message", "").strip()
        session_id = body.get("session_id", "default")
        history = body.get("history", [])
        cpvoa_context = body.get("cpvoa_context")
        # Параметры провайдера от клиента
        client_provider = body.get("provider", "auto")
        client_key = body.get("api_key", "") or ""
        client_model = body.get("model", "") or ""
        custom_url = body.get("custom_url", "") or ""

        if not user_message:
            return err("message обязателен")

        # Формируем ЦПВОА блок
        cpvoa_block = ""
        if cpvoa_context and isinstance(cpvoa_context, dict):
            incidents = cpvoa_context.get("incidents", [])
            sensors = cpvoa_context.get("sensors", {})
            connection = cpvoa_context.get("connection", "?")
            mode = cpvoa_context.get("mode", "?")
            query = cpvoa_context.get("query", "")
            lines = [
                "[ДАННЫЕ ЦПВОА — СИНХРОНИЗАЦИЯ]",
                f"Режим: {mode} | Связь: {connection}",
            ]
            active = [k for k, v in sensors.items() if v]
            if active:
                lines.append(f"Активные датчики: {', '.join(active)}")
            if query:
                lines.append(f"Последний запрос: {query}")
            if incidents:
                lines.append(f"Инцидентов: {len(incidents)}")
                for inc in incidents[:4]:
                    lines.append(f"  • [{inc.get('threat','?').upper()}] {inc.get('category','?')} — {str(inc.get('description',''))[:120]} (источник: {inc.get('source','?')}, гео: {inc.get('location','?')})")
            lines.append("[КОНЕЦ ДАННЫХ ЦПВОА]")
            cpvoa_block = "\n".join(lines)

        # Строим историю
        messages = []
        for msg in history[-10:]:
            if msg.get("role") in ("user", "assistant") and msg.get("content"):
                messages.append({"role": msg["role"], "content": msg["content"]})

        full_msg = f"{cpvoa_block}\n\n{user_message}" if cpvoa_block else user_message
        messages.append({"role": "user", "content": full_msg})

        # Определяем провайдера
        has_cpvoa = bool(cpvoa_context)
        if client_provider == "auto" or not client_provider:
            provider = auto_pick_provider(user_message, has_cpvoa)
        else:
            provider = client_provider

        # Вызываем ИИ
        used_model = client_model
        try:
            raw = dispatch_call(provider, messages, client_key, client_model, custom_url)
            result = parse_response(raw)
            if not used_model:
                defaults = {"gemini": "gemini-1.5-flash", "openai": "gpt-4o", "anthropic": "claude-3-5-sonnet", "yandex": "yandexgpt-lite"}
                used_model = defaults.get(provider, provider)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                result = {"text": "⚠️ Превышен лимит запросов. Подождите минуту.", "suggestions": ["Попробовать снова", "Другой вопрос", "Правовая база"]}
            elif e.code in (401, 403):
                result = {"text": f"⚠️ Ошибка авторизации ({provider}). Проверьте API-ключ в настройках ИИ.", "suggestions": ["Открыть настройки ИИ", "Сменить провайдера", "Попробовать снова"]}
            else:
                result = fallback_answer(user_message)
                result["text"] = f"[Ошибка {e.code} от {provider}]\n\n" + result["text"]
        except Exception as e:
            result = fallback_answer(user_message)

        # Сохраняем в БД
        try:
            conn = psycopg2.connect(os.environ["DATABASE_URL"])
            cur = conn.cursor()
            save_message(cur, session_id, "user", user_message)
            save_message(cur, session_id, "assistant", result["text"])
            conn.commit()
            cur.close()
            conn.close()
        except Exception:
            pass

        return ok({
            "reply": result["text"],
            "suggestions": result["suggestions"],
            "provider": provider,
            "model": used_model,
            "session_id": session_id,
        })

    return err("Маршрут не найден", 404)