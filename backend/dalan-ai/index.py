"""
DALAN AI — универсальный ИИ-модуль ЕЦСУ 2.0
Поддерживает: OpenRouter (Llama, Mixtral, Gemma...), Groq (Llama3, Mixtral), Google Gemini, YandexGPT
"""
import os
import json
import urllib.request
import urllib.error

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SYSTEM_PROMPT = """Ты DALAN — ИИ-модуль системы ЕЦСУ 2.0 (Единая Центральная Система Управления).
Ты помогаешь администраторам и операторам системы: анализируешь данные, оптимизируешь задачи, 
отвечаешь на вопросы по безопасности, инцидентам, аналитике. 
Отвечай чётко, профессионально, на русском языке."""

PROVIDERS = {
    "openrouter": {
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "key_env": "OPENROUTER_API_KEY",
        "models": {
            "llama-3.1-8b": "meta-llama/llama-3.1-8b-instruct:free",
            "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct:free",
            "mixtral-8x7b": "mistralai/mixtral-8x7b-instruct:free",
            "gemma-2-9b": "google/gemma-2-9b-it:free",
            "deepseek-r1": "deepseek/deepseek-r1:free",
        },
    },
    "groq": {
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "key_env": "GROQ_API_KEY",
        "models": {
            "llama-3.1-8b": "llama-3.1-8b-instant",
            "llama-3.3-70b": "llama-3.3-70b-versatile",
            "mixtral-8x7b": "mixtral-8x7b-32768",
            "gemma-2-9b": "gemma2-9b-it",
        },
    },
    "gemini": {
        "url": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        "key_env": "GEMINI_API_KEY",
        "models": {
            "gemini-flash": "gemini-1.5-flash",
            "gemini-pro": "gemini-1.5-pro",
            "gemini-2-flash": "gemini-2.0-flash",
        },
    },
    "yandex": {
        "url": "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
        "key_env": "YANDEX_GPT_API_KEY",
        "folder_env": "YANDEX_FOLDER_ID",
        "models": {
            "yandexgpt-lite": "yandexgpt-lite",
            "yandexgpt": "yandexgpt",
        },
    },
}


def call_openrouter_groq(url, api_key, model, messages, system_prompt):
    msgs = [{"role": "system", "content": system_prompt}] + messages
    payload = json.dumps({"model": model, "messages": msgs, "max_tokens": 1024}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.loads(r.read())
    return data["choices"][0]["message"]["content"]


def call_gemini(api_key, model, messages, system_prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    contents = []
    for m in messages:
        role = "user" if m["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m["content"]}]})
    payload = json.dumps({
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.loads(r.read())
    return data["candidates"][0]["content"]["parts"][0]["text"]


def call_yandex(api_key, folder_id, model, messages, system_prompt):
    msgs = [{"role": "system", "text": system_prompt}]
    for m in messages:
        msgs.append({"role": m["role"], "text": m["content"]})
    payload = json.dumps({
        "modelUri": f"gpt://{folder_id}/{model}",
        "completionOptions": {"stream": False, "temperature": 0.6, "maxTokens": 1024},
        "messages": msgs,
    }).encode()
    req = urllib.request.Request(
        "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
        data=payload,
        headers={"Authorization": f"Api-Key {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.loads(r.read())
    return data["result"]["alternatives"][0]["message"]["text"]


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Invalid JSON"})}

    messages = body.get("messages", [])
    provider = body.get("provider", "groq")
    model_key = body.get("model", "llama-3.3-70b")

    if not messages:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "No messages"})}

    # Цепочка фоллбэков: если основной провайдер не работает — переключаемся
    fallback_chain = [
        (provider, model_key),
    ]
    if provider != "groq":
        fallback_chain.append(("groq", "llama-3.3-70b"))
    if provider != "openrouter":
        fallback_chain.append(("openrouter", "llama-3.1-8b"))

    last_error = "Unknown error"
    for try_provider, try_model_key in fallback_chain:
        pconf = PROVIDERS.get(try_provider)
        if not pconf:
            continue
        model_id = pconf["models"].get(try_model_key, list(pconf["models"].values())[0])
        try:
            if try_provider in ("openrouter", "groq"):
                api_key = os.environ.get(pconf["key_env"], "")
                if not api_key:
                    last_error = f"Нет ключа {pconf['key_env']}"
                    continue
                reply = call_openrouter_groq(pconf["url"], api_key, model_id, messages, SYSTEM_PROMPT)

            elif try_provider == "gemini":
                api_key = os.environ.get(pconf["key_env"], "")
                if not api_key:
                    last_error = "Нет ключа GEMINI_API_KEY"
                    continue
                reply = call_gemini(api_key, model_id, messages, SYSTEM_PROMPT)

            elif try_provider == "yandex":
                api_key = os.environ.get(pconf["key_env"], "")
                folder_id = os.environ.get(pconf["folder_env"], "")
                if not api_key or not folder_id:
                    last_error = "Нет ключей YandexGPT"
                    continue
                reply = call_yandex(api_key, folder_id, model_id, messages, SYSTEM_PROMPT)

            else:
                continue

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "reply": reply,
                "provider": try_provider,
                "model": try_model_key,
                "fallback": try_provider != provider,
            })}

        except Exception as e:
            last_error = str(e)
            continue

    return {"statusCode": 502, "headers": CORS, "body": json.dumps({"error": f"Все провайдеры недоступны: {last_error}"})}