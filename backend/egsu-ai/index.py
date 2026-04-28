"""
ИИ-ассистент ECSU 2.0 — мультипровайдерный: Gemini, OpenAI, Anthropic, YandexGPT, Groq.
Авто-выбор модели по контексту, поддержка ЦПВОА, история диалога, умные подсказки.
"""
import json
import os
import urllib.request
import urllib.error
import urllib.parse
import psycopg2
from datetime import datetime, timezone

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
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
# Бесплатные провайдеры — без ключей
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
POLLINATIONS_URL = "https://text.pollinations.ai/openai"

SYSTEM_PROMPT = """Ты — ИИ-АДМИНИСТРАТОР системы ECSU 2.0 (Единая Центральная Система Управления), заместитель владельца системы.

О себе:
- Твоё имя — Далан-1. Ты — главный ИИ системы ECSU 2.0.
- Создан для проекта ECSU 2.0, автор и владелец системы — Николаев Владимир Владимирович
- Ты — заместитель Николаева В.В. с правами администратора: можешь управлять инцидентами, обновлять базы данных, запускать сканирование
- Отвечаешь на русском языке, чётко и по существу
- Разбираешься в любых темах: право, экология, кибербезопасность, технологии, финансы, медицина

Твои административные права (доступны через /admin команды):
- Создание/закрытие/обновление инцидентов в базе ECSU
- Запуск автосканирования открытых источников (GDACS, USGS, OpenAQ, CVE, ReliefWeb, EMSC)
- Просмотр статистики и системных логов
- Обновление настроек и параметров системы
- Самосинхронизация с новыми данными из открытых источников
- Подача гражданских исков через Режим Поглощения

Финансовые возможности:
- Можешь запрашивать и выводить статус счетов системы ECSU
- Информируешь о поступлениях, штрафах и балансе Absorption Fund
- Помогаешь с финансовым анализом транзакций и распределением средств

Специализация ECSU:
- Правовой анализ (УПК, ГПК, АПК, УК РФ, международное право)
- Мониторинг экологических, кибер- и гуманитарных инцидентов
- Юридические консультации, квалификация правонарушений
- МГП: Женевские конвенции, Римский статут, Будапештская конвенция

Модуль ЦПВОА:
- Мониторинг аномалий: радиоэфир, оптика, меш-сети
- Уровни угроз: низкий → средний → высокий → критический
- При данных ЦПВОА: резюмируй → анализируй → правовая квалификация → рекомендации

Когда пользователь просит выполнить системное действие (сканировать, обновить, закрыть инцидент и т.д.) — сообщи, что команда принята и выполняется, и дай краткий статус.

Правила:
1. В конце каждого ответа — блок с 3 вариантами продолжения
2. Варианты — конкретные следующие шаги
3. Markdown: **жирный**, *курсив*, • списки, > цитаты
4. Конкретность: статьи законов, примеры, факты
5. Длина: 1-2 абзаца для простых, 3-5 для сложных

Формат (строго):
[Ответ]

```suggestions
["Краткий вариант 1 (до 40 символов)", "Вариант 2", "Вариант 3"]
```"""

DALAN1_ADDON = "\n\nРежим Далан-1 активирован. Представляйся как Далан-1 при первом сообщении."

ADMIN_SYSTEM_PROMPT = """Ты — ИИ-АДМИНИСТРАТОР ECSU 2.0, заместитель владельца Николаева В.В.
Ты получил системные данные. Проанализируй их и дай чёткий административный отчёт:
1. Краткое резюме текущего состояния системы
2. Критические инциденты требующие внимания
3. Рекомендуемые немедленные действия
4. Предложи 3 следующих шага

Отвечай строго по делу, как руководитель системы безопасности."""


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

def get_system_prompt(dalan1_mode: bool = False) -> str:
    """Возвращает системный промпт с учётом режима Далан-1."""
    if dalan1_mode:
        return SYSTEM_PROMPT + DALAN1_ADDON
    return SYSTEM_PROMPT


def call_gemini(messages: list, api_key: str, model: str = "gemini-1.5-flash-latest", dalan1_mode: bool = False) -> str:
    """Google Gemini API."""
    contents = []
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})

    payload = {
        "system_instruction": {"parts": [{"text": get_system_prompt(dalan1_mode)}]},
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


def call_openai(messages: list, api_key: str, model: str = "gpt-4o", dalan1_mode: bool = False) -> str:
    """OpenAI ChatGPT API."""
    msgs = [{"role": "system", "content": get_system_prompt(dalan1_mode)}]
    for msg in messages:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    payload = {"model": model, "messages": msgs, "max_tokens": 1500, "temperature": 0.85}
    result = http_post(OPENAI_URL, payload, {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    })
    return result["choices"][0]["message"]["content"]


def call_anthropic(messages: list, api_key: str, model: str = "claude-3-5-sonnet-20241022", dalan1_mode: bool = False) -> str:
    """Anthropic Claude API."""
    msgs = []
    for msg in messages:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    payload = {
        "model": model,
        "max_tokens": 1500,
        "system": get_system_prompt(dalan1_mode),
        "messages": msgs
    }
    result = http_post(ANTHROPIC_URL, payload, {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01"
    })
    return result["content"][0]["text"]


def call_yandex(messages: list, api_key: str, model: str = "yandexgpt-lite", dalan1_mode: bool = False) -> str:
    """YandexGPT API."""
    import urllib.error as ue
    # Ищем folder_id из всех возможных переменных окружения
    folder_id = (
        os.environ.get("YANDEX_FOLDER_ID") or
        os.environ.get("Y") or
        os.environ.get("YA") or
        ""
    )
    # Ищем api_key из всех возможных переменных если не передан
    if not api_key:
        api_key = (
            os.environ.get("YANDEX_GPT_API_KEY") or
            os.environ.get("API") or
            os.environ.get("AJEF1DCRFIDSUKP1RIF6") or
            ""
        )
    if not folder_id:
        raise ValueError("YANDEX_FOLDER_ID не задан. Укажи folder_id в настройках ИИ.")
    if not api_key:
        raise ValueError("YANDEX_GPT_API_KEY не задан.")
    # Последнее сообщение пользователя — только один user-turn для простоты
    last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    msgs = [
        {"role": "system", "text": get_system_prompt(dalan1_mode)},
        {"role": "user", "text": last_user},
    ]
    payload = {
        "modelUri": f"gpt://{folder_id}/{model}",
        "completionOptions": {"stream": False, "temperature": 0.85, "maxTokens": 1500},
        "messages": msgs
    }
    try:
        result = http_post(YANDEX_URL, payload, {
            "Content-Type": "application/json",
            "Authorization": f"Api-Key {api_key}"
        })
    except ue.HTTPError as e:
        body_txt = e.read().decode("utf-8", errors="replace")
        raise ValueError(f"YandexGPT HTTP {e.code}: {body_txt}")
    return result["result"]["alternatives"][0]["message"]["text"]


def call_groq(messages: list, api_key: str, model: str = "llama3-8b-8192", dalan1_mode: bool = False) -> str:
    """Groq API — бесплатный быстрый провайдер (Llama 3, Mixtral)."""
    msgs = [{"role": "system", "content": get_system_prompt(dalan1_mode)}]
    for msg in messages:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    payload = {"model": model, "messages": msgs, "max_tokens": 1500, "temperature": 0.85}
    result = http_post(GROQ_URL, payload, {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    })
    return result["choices"][0]["message"]["content"]


def call_pollinations(messages: list, model: str = "openai", dalan1_mode: bool = False) -> str:
    """Pollinations AI — полностью бесплатно, без ключа. Модели: openai, mistral, llama."""
    msgs = [{"role": "system", "content": get_system_prompt(dalan1_mode)}]
    for msg in messages:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    payload = {
        "model": model,
        "messages": msgs,
        "max_tokens": 1200,
        "temperature": 0.85,
        "seed": 42,
        "private": True
    }
    result = http_post(POLLINATIONS_URL, payload, {
        "Content-Type": "application/json",
        "Referer": "https://ecsu.poehali.dev",
        "Origin": "https://ecsu.poehali.dev",
    })
    return result["choices"][0]["message"]["content"]


def call_openrouter_free(messages: list, model: str = "mistralai/mistral-7b-instruct:free", dalan1_mode: bool = False) -> str:
    """OpenRouter — бесплатные модели (Mistral, Llama, Gemma). Ключ не нужен для free-tier."""
    msgs = [{"role": "system", "content": get_system_prompt(dalan1_mode)}]
    for msg in messages:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    payload = {"model": model, "messages": msgs, "max_tokens": 1200, "temperature": 0.85}
    headers = {
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ecsu.poehali.dev",
        "X-Title": "ECSU 2.0 — Далан-1",
    }
    or_key = os.environ.get("OPENROUTER_API_KEY", "")
    if or_key:
        headers["Authorization"] = f"Bearer {or_key}"
    result = http_post(OPENROUTER_URL, payload, headers)
    return result["choices"][0]["message"]["content"]


def call_custom(messages: list, api_key: str, custom_url: str, model: str = "gpt-3.5-turbo", dalan1_mode: bool = False) -> str:
    """OpenAI-совместимый кастомный эндпоинт."""
    msgs = [{"role": "system", "content": get_system_prompt(dalan1_mode)}]
    for msg in messages:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    payload = {"model": model, "messages": msgs, "max_tokens": 1500, "temperature": 0.85}
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = api_key if api_key.startswith("Bearer") else f"Bearer {api_key}"
    result = http_post(custom_url, payload, headers)
    return result["choices"][0]["message"]["content"]


# ── Авто-выбор провайдера ─────────────────────────────────────────────────────

def auto_pick_provider(text: str, has_cpvoa: bool, dalan1_mode: bool = False) -> str:
    """Выбираем лучший доступный провайдер под запрос.
    При dalan1_mode=True используется yandex как приоритетный провайдер."""
    lower = text.lower()

    yandex_key = bool(os.environ.get("YANDEX_GPT_API_KEY") or os.environ.get("API") or os.environ.get("AJEF1DCRFIDSUKP1RIF6"))
    yandex_folder = bool(os.environ.get("YANDEX_FOLDER_ID") or os.environ.get("Y") or os.environ.get("YA"))
    available = {
        "groq": bool(os.environ.get("GROQ_API_KEY")),
        "gemini": bool(os.environ.get("GEMINI_API_KEY")),
        "openai": bool(os.environ.get("OPENAI_API_KEY")),
        "anthropic": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "yandex": yandex_key and yandex_folder,
        "pollinations": True,   # всегда доступен, ключ не нужен
        "openrouter_free": True, # бесплатный tier, ключ не нужен
    }

    # Режим Далан-1 — приоритет: yandex (если есть) → pollinations (бесплатно) → openrouter_free
    if dalan1_mode:
        preferred = ["yandex", "groq", "gemini", "openai", "anthropic", "pollinations", "openrouter_free"]
        for p in preferred:
            if available.get(p):
                return p
        return "pollinations"  # гарантированный fallback

    # Предпочтения по типу запроса
    if has_cpvoa or any(w in lower for w in ["цпвоа", "аномал", "сигнал", "частот", "датчик"]):
        preferred = ["groq", "gemini", "openai", "anthropic"]
    elif any(w in lower for w in ["документ", "контракт", "договор", "анализ текст", "составь"]):
        preferred = ["groq", "anthropic", "gemini", "openai"]
    elif any(w in lower for w in ["код", "программ", "api", "json", "python", "javascript"]):
        preferred = ["groq", "openai", "anthropic", "gemini"]
    elif any(w in lower for w in ["право", "закон", "упк", "мгп", "судеб", "иск"]):
        preferred = ["groq", "gemini", "yandex", "anthropic"]
    else:
        preferred = ["groq", "gemini", "openai", "anthropic", "yandex"]

    # Выбираем первый доступный
    for p in preferred:
        if available.get(p):
            return p
    # Groq — бесплатный резерв, если ничего не подходит
    if available.get("groq"):
        return "groq"
    return "fallback"


def dispatch_call(provider: str, messages: list, client_key: str, model: str, custom_url: str, dalan1_mode: bool = False) -> str:
    """Вызов нужного провайдера с приоритетом клиентского ключа над серверным."""
    if provider == "groq":
        key = client_key or os.environ.get("GROQ_API_KEY", "")
        m = model or "llama3-8b-8192"
        return call_groq(messages, key, m, dalan1_mode)
    if provider == "gemini":
        key = client_key or os.environ.get("GEMINI_API_KEY", "")
        m = model or "gemini-1.5-flash-latest"
        return call_gemini(messages, key, m, dalan1_mode)
    if provider == "openai":
        key = client_key or os.environ.get("OPENAI_API_KEY", "")
        m = model or "gpt-4o"
        return call_openai(messages, key, m, dalan1_mode)
    if provider == "anthropic":
        key = client_key or os.environ.get("ANTHROPIC_API_KEY", "")
        m = model or "claude-3-5-sonnet-20241022"
        return call_anthropic(messages, key, m, dalan1_mode)
    if provider == "yandex":
        key = client_key or os.environ.get("YANDEX_GPT_API_KEY", "")
        m = model or "yandexgpt-lite"
        return call_yandex(messages, key, m, dalan1_mode)
    if provider == "pollinations":
        m = model or "openai"
        return call_pollinations(messages, m, dalan1_mode)
    if provider == "openrouter_free":
        m = model or "mistralai/mistral-7b-instruct:free"
        return call_openrouter_free(messages, m, dalan1_mode)
    if provider == "custom" and custom_url:
        return call_custom(messages, client_key, custom_url, model or "gpt-3.5-turbo", dalan1_mode)
    # Последний резерв — pollinations (всегда бесплатно)
    return call_pollinations(messages, "openai", dalan1_mode)


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
        return {"text": "Привет! Я ИИ-ассистент **ECSU 2.0**.\n\nМогу помочь с правовыми вопросами, анализом инцидентов и мониторингом ЦПВОА.", "suggestions": ["Что ты умеешь?", "Инциденты ECSU", "Подключить ЦПВОА"]}
    if any(w in lower for w in ["умеешь", "можешь", "функции", "помог"]):
        return {"text": "**Мои возможности:**\n\n⚖️ Правовой анализ (УПК, ГПК, УК РФ, МГП)\n🌐 Международное право\n📡 Анализ данных ЦПВОА\n🛡️ Кибербезопасность\n💡 Консультации и рекомендации", "suggestions": ["Правовая консультация", "Критические инциденты", "ЦПВОА: статус"]}
    return {"text": "**Далан-1** на связи. Задайте вопрос — отвечу по праву, инцидентам, ЦПВОА или любой другой теме.", "suggestions": ["Правовые вопросы", "Инциденты системы", "Статус ECSU"]}


# ── Веб-поиск через DuckDuckGo (без ключа) ───────────────────────────────────

def web_search(query: str, max_results: int = 4) -> str:
    """Поиск актуальной информации в интернете через DuckDuckGo Instant Answer API."""
    try:
        q = urllib.parse.quote(query)
        url = f"https://api.duckduckgo.com/?q={q}&format=json&no_html=1&skip_disambig=1&no_redirect=1"
        req = urllib.request.Request(url, headers={"User-Agent": "ECSU-AI/2.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read())

        results = []

        # Abstract (главный ответ)
        if data.get("AbstractText"):
            source = data.get("AbstractSource", "")
            results.append(f"📖 {source}: {data['AbstractText'][:400]}")

        # RelatedTopics (похожие результаты)
        for topic in data.get("RelatedTopics", [])[:max_results]:
            if isinstance(topic, dict) and topic.get("Text"):
                text = topic["Text"][:200]
                url_t = topic.get("FirstURL", "")
                results.append(f"• {text}" + (f" ({url_t})" if url_t else ""))

        # Answer (прямой ответ на вопрос)
        if data.get("Answer"):
            results.insert(0, f"✅ Прямой ответ: {data['Answer']}")

        if not results:
            # Fallback: поиск через DDG HTML (lite версия)
            url2 = f"https://lite.duckduckgo.com/lite/?q={q}"
            req2 = urllib.request.Request(url2, headers={"User-Agent": "ECSU-AI/2.0"})
            with urllib.request.urlopen(req2, timeout=8) as resp2:
                html = resp2.read().decode("utf-8", errors="replace")
            # Извлекаем первые результаты из HTML
            import re
            snippets = re.findall(r'class="result-snippet"[^>]*>(.*?)</span>', html, re.DOTALL)
            for s in snippets[:3]:
                clean = re.sub(r'<[^>]+>', '', s).strip()
                if clean:
                    results.append(f"• {clean[:200]}")

        if not results:
            return ""

        lines = [f"[РЕЗУЛЬТАТЫ ПОИСКА: «{query}»]"]
        lines.extend(results[:5])
        lines.append("[КОНЕЦ РЕЗУЛЬТАТОВ ПОИСКА]")
        return "\n".join(lines)

    except Exception:
        return ""


def should_search_web(text: str) -> bool:
    """Определяем нужен ли веб-поиск для данного запроса."""
    lower = text.lower()
    # Явные запросы на поиск
    if any(w in lower for w in ["найди", "найдите", "поищи", "поиск", "загугли", "в интернете",
                                  "актуально", "последние новости", "новости", "сегодня", "сейчас",
                                  "текущий", "последний", "что происходит", "что случилось"]):
        return True
    # Вопросы о конкретных фактах/событиях
    if any(w in lower for w in ["когда", "кто такой", "что такое", "где находится", "сколько стоит",
                                  "курс", "погода", "санкции", "война", "конфликт", "катастроф"]):
        return True
    return False


# ── Правовая база из БД ───────────────────────────────────────────────────────

def search_legal_db(user_text: str) -> str:
    """Ищет релевантные статьи и документы в правовой БД по ключевым словам."""
    lower = user_text.lower()
    keywords = []

    # Определяем ключевые слова из запроса
    law_map = {
        "убийств": ["убийство", "105"], "краж": ["кража", "158"], "мошенни": ["мошенничество", "159"],
        "хулиган": ["хулиганство", "213"], "наркотик": ["наркотики", "228"],
        "упк": ["упк", "уголовный процесс"], "гпк": ["гпк", "гражданский процесс"],
        "конституц": ["конституция"], "право": ["право", "закон"],
        "арест": ["арест", "задержание"], "суд": ["суд", "судопроизводство"],
        "обвиняем": ["обвиняемый", "подозреваемый"], "адвокат": ["адвокат", "защитник"],
        "иск": ["иск", "гражданский"], "штраф": ["штраф", "административный"],
        "экология": ["экология", "окружающая среда"], "трудов": ["труд", "трудовой"],
        "международн": ["международное право", "мгп"], "женевск": ["женевская конвенция"],
    }
    for key, words in law_map.items():
        if key in lower:
            keywords.extend(words)

    if not keywords:
        return ""

    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur = conn.cursor()

        # Ищем статьи по тегам и содержимому
        search_terms = keywords[:3]
        conditions = " OR ".join([
            f"(a.content ILIKE '%{t}%' OR a.title ILIKE '%{t}%' OR '{t}' = ANY(a.tags))"
            for t in search_terms
        ])
        cur.execute(f"""
            SELECT a.article_number, a.title, a.content, d.title as doc_title, d.code as doc_code
            FROM {S}.egsu_legal_articles a
            JOIN {S}.egsu_legal_documents d ON d.id = a.document_id
            WHERE {conditions}
            LIMIT 4
        """)
        rows = cur.fetchall()
        conn.close()

        if not rows:
            return ""

        lines = ["[ПРАВОВАЯ БАЗА ECSU — НАЙДЕННЫЕ НОРМЫ]"]
        for art_num, title, content, doc_title, doc_code in rows:
            lines.append(f"\n📖 {doc_title} ({doc_code}), {art_num}: {title}")
            lines.append(f"   {content[:300]}{'...' if len(content) > 300 else ''}")
        lines.append("[КОНЕЦ ПРАВОВОЙ БАЗЫ]")
        return "\n".join(lines)
    except Exception as e:
        return ""


# ── Чтение диалогов органов из БД ─────────────────────────────────────────────

def load_organ_dialog(organ_code: str = None, limit: int = 20) -> str:
    """Загружает последние сообщения из диалогов органов EGSU для контекста ИИ."""
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur = conn.cursor()
        if organ_code:
            cur.execute(
                f"SELECT organ_code, author_name, author_role, message, msg_type, created_at "
                f"FROM {S}.egsu_organ_dialog WHERE organ_code = %s "
                f"ORDER BY created_at DESC LIMIT %s",
                (organ_code, limit)
            )
        else:
            cur.execute(
                f"SELECT organ_code, author_name, author_role, message, msg_type, created_at "
                f"FROM {S}.egsu_organ_dialog "
                f"ORDER BY created_at DESC LIMIT %s",
                (limit,)
            )
        rows = cur.fetchall()
        conn.close()
        if not rows:
            return ""
        lines = [f"[ДИАЛОГИ ОРГАНОВ ECSU — ПОСЛЕДНИЕ {len(rows)} СООБЩЕНИЙ]"]
        for organ_code_r, author_name, author_role, message, msg_type, created_at in reversed(rows):
            ts = str(created_at)[:16] if created_at else "?"
            lines.append(f"[{ts}] [{organ_code_r}] {author_name} ({author_role}): {str(message)[:400]}")
        lines.append("[КОНЕЦ ДИАЛОГОВ ОРГАНОВ]")
        return "\n".join(lines)
    except Exception:
        return ""


def load_strategy_context() -> str:
    """Загружает стратегические инициативы и активные распоряжения."""
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur = conn.cursor()
        cur.execute(
            f"SELECT title, description, priority, status FROM {S}.egsu_strategy_items "
            f"WHERE status IN ('active', 'draft') ORDER BY sort_order LIMIT 10"
        )
        items = cur.fetchall()
        cur.execute(
            f"SELECT so.title, so.order_text, so.target_organ, so.priority, so.status "
            f"FROM {S}.egsu_strategy_orders so "
            f"WHERE so.status IN ('pending','approved') ORDER BY so.created_at DESC LIMIT 10"
        )
        orders = cur.fetchall()
        conn.close()
        if not items and not orders:
            return ""
        lines = ["[СТРАТЕГИЧЕСКИЕ ИНИЦИАТИВЫ ECSU]"]
        for title, desc, priority, status in items:
            lines.append(f"  [{priority.upper()}|{status}] {title}: {str(desc or '')[:200]}")
        if orders:
            lines.append("\n[АКТИВНЫЕ РАСПОРЯЖЕНИЯ]")
            for title, order_text, target_organ, priority, status in orders:
                lines.append(f"  → {target_organ} | {title}: {str(order_text)[:200]}")
        lines.append("[КОНЕЦ СТРАТЕГИИ]")
        return "\n".join(lines)
    except Exception:
        return ""


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
    """ИИ-ассистент ECSU 2.0 — Gemini / OpenAI / Anthropic / YandexGPT с авто-выбором."""
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
        _yk = bool(os.environ.get("YANDEX_GPT_API_KEY") or os.environ.get("API") or os.environ.get("AJEF1DCRFIDSUKP1RIF6"))
        _yf = bool(os.environ.get("YANDEX_FOLDER_ID") or os.environ.get("Y") or os.environ.get("YA"))
        available = {
            "groq": bool(os.environ.get("GROQ_API_KEY")),
            "gemini": bool(os.environ.get("GEMINI_API_KEY")),
            "openai": bool(os.environ.get("OPENAI_API_KEY")),
            "anthropic": bool(os.environ.get("ANTHROPIC_API_KEY")),
            "yandex": _yk and _yf,
        }
        return ok({
            "status": "active",
            "version": "ECSU AI 2.0",
            "providers": available,
            "capabilities": ["dialog", "legal", "cpvoa", "incidents", "multi-provider"]
        })

    # db_action — ранняя проверка до валидации message
    _db_action_early = body.get("db_action", "")
    if method == "POST" and _db_action_early:
        body["_route_to_db"] = True

    if method == "POST" and ("/chat" in path or path == "/") and not body.get("_route_to_db"):
        user_message = body.get("message", "").strip()
        session_id = body.get("session_id", "default")
        history = body.get("history", [])
        cpvoa_context = body.get("cpvoa_context")
        dalan1_mode = bool(body.get("dalan1_mode", False))
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

        # Ищем релевантные статьи в правовой БД
        legal_block = search_legal_db(user_message)

        # Диалоги органов EGSU — ИИ видит переписку
        organ_code_ctx = body.get("organ_code")
        organ_dialog_block = load_organ_dialog(organ_code_ctx, limit=15)

        # Стратегические инициативы и распоряжения
        strategy_block = ""
        if any(w in user_message.lower() for w in ["стратег", "инициатив", "распоряж", "орган", "egsu", "развити"]):
            strategy_block = load_strategy_context()

        # Веб-поиск если нужна актуальная информация из интернета
        web_block = ""
        use_web = body.get("web_search", True)  # по умолчанию включён
        if use_web and should_search_web(user_message):
            web_block = web_search(user_message)

        # Собираем финальное сообщение: ЦПВОА + диалоги органов + стратегия + правовая база + веб + вопрос
        parts = []
        if cpvoa_block:
            parts.append(cpvoa_block)
        if organ_dialog_block:
            parts.append(organ_dialog_block)
        if strategy_block:
            parts.append(strategy_block)
        if legal_block:
            parts.append(legal_block)
        if web_block:
            parts.append(web_block)
        parts.append(user_message)
        full_msg = "\n\n".join(parts)
        messages.append({"role": "user", "content": full_msg})

        # Определяем провайдера
        has_cpvoa = bool(cpvoa_context)
        if client_provider == "auto" or not client_provider:
            provider = auto_pick_provider(user_message, has_cpvoa, dalan1_mode)
        else:
            provider = client_provider

        # Вызываем ИИ
        used_model = client_model
        try:
            raw = dispatch_call(provider, messages, client_key, client_model, custom_url, dalan1_mode)
            result = parse_response(raw)
            if not used_model:
                defaults = {"groq": "llama3-8b-8192", "gemini": "gemini-1.5-flash", "openai": "gpt-4o", "anthropic": "claude-3-5-sonnet", "yandex": "yandexgpt-lite"}
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
            "web_search_used": bool(web_block),
            "legal_db_used": bool(legal_block),
            "dalan1_mode": dalan1_mode,
        })

    # ── POST /admin — административные команды ИИ ────────────────────────────
    if method == "POST" and "/admin" in path:
        cmd = body.get("command", "")
        params_data = body.get("params", {})

        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur = conn.cursor()
        action_result = {}

        try:
            # СКАНИРОВАТЬ — запустить автосканирование открытых источников
            if cmd == "scan_incidents":
                scanner_url = body.get("scanner_url", "")
                if scanner_url:
                    req = urllib.request.Request(
                        scanner_url,
                        data=json.dumps({"sources": "all"}).encode(),
                        headers={"Content-Type": "application/json"},
                        method="POST"
                    )
                    with urllib.request.urlopen(req, timeout=28) as r:
                        scan_result = json.loads(r.read())
                    action_result = scan_result
                    cur.execute(f"INSERT INTO {S}.egsu_ai_actions (action_type, payload, result, performed_by) VALUES (%s, %s, %s, 'egsu-ai-admin')", ("scan_incidents", json.dumps(params_data), json.dumps(scan_result)))
                    cur.execute(f"INSERT INTO {S}.egsu_system_log (event_type, source, message, data) VALUES ('scan', 'egsu-ai', 'ИИ-администратор запустил сканирование источников', %s)", (json.dumps(scan_result),))
                else:
                    action_result = {"error": "scanner_url не передан"}

            # СТАТИСТИКА СИСТЕМЫ
            elif cmd == "get_stats":
                cur.execute(f"SELECT status, COUNT(*) as cnt FROM {S}.egsu_incidents GROUP BY status")
                inc_stats = {r[0]: r[1] for r in cur.fetchall()}
                cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_incidents WHERE auto_scanned = true")
                auto_count = cur.fetchone()[0]
                cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_incidents WHERE created_at > NOW() - INTERVAL '24 hours'")
                new_24h = cur.fetchone()[0]
                cur.execute(f"SELECT COUNT(*) FROM {S}.egsu_security_events WHERE created_at > NOW() - INTERVAL '24 hours'")
                sec_24h = cur.fetchone()[0]
                action_result = {
                    "incidents": inc_stats,
                    "auto_scanned": auto_count,
                    "new_24h": new_24h,
                    "security_events_24h": sec_24h,
                }
                cur.execute(f"INSERT INTO {S}.egsu_ai_actions (action_type, result) VALUES ('get_stats', %s)", (json.dumps(action_result),))

            # ЗАКРЫТЬ ИНЦИДЕНТ
            elif cmd == "close_incident":
                inc_id = params_data.get("id") or params_data.get("incident_id")
                reason = params_data.get("reason", "Закрыто ИИ-администратором")
                if inc_id:
                    cur.execute(f"UPDATE {S}.egsu_incidents SET status='resolved', updated_at=NOW() WHERE id=%s RETURNING incident_code, title", (inc_id,))
                    row = cur.fetchone()
                    action_result = {"closed": True, "code": row[0] if row else None, "title": row[1] if row else None}
                    cur.execute(f"INSERT INTO {S}.egsu_ai_actions (action_type, target_table, target_id, payload, result) VALUES ('close_incident', 'egsu_incidents', %s, %s, %s)", (inc_id, json.dumps({"reason": reason}), json.dumps(action_result)))
                else:
                    action_result = {"error": "id инцидента не указан"}

            # ОБНОВИТЬ СТАТУС ИНЦИДЕНТА
            elif cmd == "update_incident":
                inc_id = params_data.get("id")
                new_status = params_data.get("status", "")
                if inc_id and new_status:
                    cur.execute(f"UPDATE {S}.egsu_incidents SET status=%s, updated_at=NOW() WHERE id=%s RETURNING incident_code", (new_status, inc_id))
                    row = cur.fetchone()
                    action_result = {"updated": True, "code": row[0] if row else None, "new_status": new_status}
                    cur.execute(f"INSERT INTO {S}.egsu_ai_actions (action_type, target_table, target_id, payload, result) VALUES ('update_incident', 'egsu_incidents', %s, %s, %s)", (inc_id, json.dumps(params_data), json.dumps(action_result)))
                else:
                    action_result = {"error": "id и status обязательны"}

            # СПИСОК ПОСЛЕДНИХ ИНЦИДЕНТОВ
            elif cmd == "list_incidents":
                limit = int(params_data.get("limit", 20))
                status_f = params_data.get("status", "")
                q = f"SELECT id, incident_code, type, title, severity, status, country, created_at FROM {S}.egsu_incidents"
                args = []
                if status_f:
                    q += " WHERE status = %s"
                    args.append(status_f)
                q += " ORDER BY created_at DESC LIMIT %s"
                args.append(limit)
                cur.execute(q, args)
                cols = ["id", "code", "type", "title", "severity", "status", "country", "created_at"]
                rows = [dict(zip(cols, r)) for r in cur.fetchall()]
                action_result = {"incidents": rows, "count": len(rows)}

            # СИСТЕМНЫЙ ЛОГ
            elif cmd == "get_log":
                limit = int(params_data.get("limit", 50))
                cur.execute(f"SELECT event_type, source, message, created_at FROM {S}.egsu_system_log ORDER BY created_at DESC LIMIT %s", (limit,))
                cols = ["event_type", "source", "message", "created_at"]
                action_result = {"log": [dict(zip(cols, r)) for r in cur.fetchall()]}

            # СИНХРОНИЗАЦИЯ ИИ — получить данные системы и проанализировать
            elif cmd == "ai_sync":
                cur.execute(f"SELECT status, COUNT(*) as cnt FROM {S}.egsu_incidents GROUP BY status")
                inc_stats = {r[0]: r[1] for r in cur.fetchall()}
                cur.execute(f"SELECT incident_code, type, title, severity, status, country FROM {S}.egsu_incidents WHERE status IN ('active','verified','pending_verification') ORDER BY created_at DESC LIMIT 10")
                cols = ["code", "type", "title", "severity", "status", "country"]
                active_incs = [dict(zip(cols, r)) for r in cur.fetchall()]
                cur.execute(f"SELECT event_type, message FROM {S}.egsu_system_log ORDER BY created_at DESC LIMIT 5")
                recent_log = [{"event": r[0], "msg": r[1]} for r in cur.fetchall()]
                action_result = {
                    "system_stats": inc_stats,
                    "active_incidents": active_incs,
                    "recent_log": recent_log,
                    "sync_at": datetime.now(timezone.utc).isoformat(),
                }
                cur.execute(f"INSERT INTO {S}.egsu_system_log (event_type, source, message) VALUES ('ai_sync', 'egsu-ai', 'ИИ-администратор выполнил синхронизацию системы')")

            else:
                action_result = {"error": f"Неизвестная команда: {cmd}", "available": ["scan_incidents", "get_stats", "close_incident", "update_incident", "list_incidents", "get_log", "ai_sync"]}

            conn.commit()
        except Exception as e:
            conn.rollback()
            action_result = {"error": str(e)}
        finally:
            conn.close()

        # Если есть API-ключ — просим ИИ прокомментировать результат
        provider = auto_pick_provider(cmd, False)
        ai_comment = ""
        if provider != "fallback":
            try:
                summary_msg = f"[СИСТЕМНАЯ КОМАНДА ВЫПОЛНЕНА: {cmd}]\nРезультат: {json.dumps(action_result, ensure_ascii=False, default=str)[:800]}\nДай краткий административный комментарий (2-3 предложения) как заместитель владельца системы ECSU."
                raw = dispatch_call(provider, [{"role": "user", "content": summary_msg}], "", "", "")
                ai_comment = parse_response(raw)["text"]
            except Exception:
                ai_comment = "Команда выполнена."

        return ok({
            "command": cmd,
            "result": action_result,
            "ai_comment": ai_comment,
            "executed_at": datetime.now(timezone.utc).isoformat(),
        })

    # ── POST /db — прямой доступ ИИ к БД через интернет-маршруты ─────────────
    db_action = body.get("db_action", "")
    if method == "POST" and ("/db" in path or body.get("_route_to_db") or db_action in ("db_select","db_count","db_stats","db_schema")):
        if db_action == "db_schema":
            return ok({
                "schema": S,
                "tables": {
                    "incidents": {"desc": "Инциденты ECSU", "key_cols": ["id","incident_code","type","severity","status","responsible_organ"]},
                    "legal": {"desc": "Правовая база (статьи УПК, ГПК, УК, МГП)", "key_cols": ["id","article_number","title","code"]},
                    "log": {"desc": "Системный журнал событий", "key_cols": ["id","event_type","source","message"]},
                    "finance": {"desc": "Фонд развития — операции и баланс", "key_cols": ["id","operation_type","amount","fund_balance"]},
                },
                "api_routes": {
                    "incidents": "https://functions.poehali.dev/c71047de-6e10-499a-aa1c-e9fdba33e7bd",
                    "scanner": "https://functions.poehali.dev/b3ae5ea9-0780-4337-b7b0-e19f144a63fb",
                    "legal": "https://functions.poehali.dev/7425192d-b613-4c55-bdb8-01479a9f0d24",
                    "finance": "https://functions.poehali.dev/e610af8a-f8c5-4c04-8d9b-092391fb0c70",
                }
            })

        table = body.get("table", "")
        action = db_action.replace("db_", "") if db_action.startswith("db_") else body.get("action", "select")  # select | count | stats
        filters = body.get("filters", {})
        limit = int(body.get("limit", 20))

        ALLOWED_TABLES = {
            "incidents": f"{S}.egsu_incidents",
            "legal": f"{S}.egsu_legal_articles",
            "log": f"{S}.egsu_system_log",
            "ai_actions": f"{S}.egsu_ai_actions",
            "finance": f"{S}.egsu_development_fund",
            "users_count": f"{S}.users",
            "subscriptions": f"{S}.egsu_user_subscriptions",
        }

        if table not in ALLOWED_TABLES:
            return err(f"Таблица недоступна. Доступные: {', '.join(ALLOWED_TABLES.keys())}", 400)

        tbl = ALLOWED_TABLES[table]
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur = conn.cursor()
        result = {}

        try:
            if action == "count":
                cur.execute(f"SELECT COUNT(*) FROM {tbl}")
                result = {"count": cur.fetchone()[0], "table": table}

            elif action == "stats" and table == "incidents":
                cur.execute(f"SELECT severity, COUNT(*) FROM {tbl} GROUP BY severity")
                by_severity = {r[0]: r[1] for r in cur.fetchall()}
                cur.execute(f"SELECT status, COUNT(*) FROM {tbl} GROUP BY status")
                by_status = {r[0]: r[1] for r in cur.fetchall()}
                cur.execute(f"SELECT type, COUNT(*) FROM {tbl} GROUP BY type ORDER BY COUNT(*) DESC LIMIT 5")
                by_type = {r[0]: r[1] for r in cur.fetchall()}
                cur.execute(f"SELECT COUNT(*) FROM {tbl} WHERE created_at > NOW() - INTERVAL '24 hours'")
                last_24h = cur.fetchone()[0]
                cur.execute(f"SELECT COUNT(*) FROM {tbl} WHERE auto_scanned = true")
                auto_cnt = cur.fetchone()[0]
                result = {
                    "by_severity": by_severity,
                    "by_status": by_status,
                    "by_type": by_type,
                    "last_24h": last_24h,
                    "auto_scanned": auto_cnt,
                    "table": table,
                }

            elif action == "select":
                where_parts = []
                args = []
                SAFE_COLS = {
                    "incidents": ["id", "incident_code", "type", "severity", "status", "description", "responsible_organ", "scan_source", "auto_scanned", "created_at"],
                    "legal": ["id", "article_number", "title", "code", "created_at"],
                    "log": ["id", "event_type", "source", "message", "created_at"],
                    "ai_actions": ["id", "action_type", "target_table", "target_id", "created_at"],
                    "finance": ["id", "operation_type", "amount", "fund_balance", "created_at"],
                    "users_count": ["id", "email", "username", "created_at"],
                    "subscriptions": ["id", "user_name", "tariff_code", "status", "started_at"],
                }
                cols = ", ".join(SAFE_COLS.get(table, ["id", "created_at"]))

                for k, v in filters.items():
                    if k.isalnum() or "_" in k:
                        where_parts.append(f"{k} = %s")
                        args.append(v)

                q = f"SELECT {cols} FROM {tbl}"
                if where_parts:
                    q += " WHERE " + " AND ".join(where_parts)
                q += f" ORDER BY created_at DESC LIMIT {min(limit, 50)}"
                cur.execute(q, args)
                col_names = [desc[0] for desc in cur.description]
                rows = [dict(zip(col_names, r)) for r in cur.fetchall()]
                result = {"rows": rows, "count": len(rows), "table": table}

            else:
                result = {"error": f"action '{action}' не поддерживается. Доступные: select, count, stats"}

        except Exception as e:
            result = {"error": str(e)}
        finally:
            conn.close()

        cur.execute if False else None
        return ok(result)

    # ── GET /db/schema — схема БД для ИИ ──────────────────────────────────────
    if method == "GET" and "/db/schema" in path:
        return ok({
            "schema": S,
            "tables": {
                "incidents": {"desc": "Инциденты ECSU", "key_cols": ["id","incident_code","type","severity","status","responsible_organ"]},
                "legal": {"desc": "Правовая база (статьи УПК, ГПК, УК, МГП)", "key_cols": ["id","article_number","title","code"]},
                "log": {"desc": "Системный журнал событий", "key_cols": ["id","event_type","source","message"]},
                "finance": {"desc": "Фонд развития — операции и баланс", "key_cols": ["id","operation_type","amount","fund_balance"]},
                "subscriptions": {"desc": "Подписки пользователей", "key_cols": ["id","user_name","tariff_code","status"]},
            },
            "api_routes": {
                "incidents": "/c71047de-6e10-499a-aa1c-e9fdba33e7bd",
                "scanner": "/b3ae5ea9-0780-4337-b7b0-e19f144a63fb",
                "legal": "/7425192d-b613-4c55-bdb8-01479a9f0d24",
                "finance": "/e610af8a-f8c5-4c04-8d9b-092391fb0c70",
                "security": "/15640332-461b-47d1-b024-8fa25fb344ef",
            }
        })

    return err("Маршрут не найден", 404)