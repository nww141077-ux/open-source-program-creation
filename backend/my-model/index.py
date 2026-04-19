"""
Управление персональной ИИ-моделью: настройка, обучающие данные,
юридические документы и журнал дообучения.
"""
import os
import json
import hashlib
import time
import psycopg2
from datetime import datetime

S = "t_p38294978_open_source_program_"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

# Каталог открытых моделей с лицензиями
BASE_MODELS = [
    {
        "id": "llama3-8b",
        "name": "Meta Llama 3 8B",
        "org": "Meta AI",
        "license": "Meta Llama 3 Community License",
        "license_type": "open",
        "license_url": "https://llama.meta.com/llama3/license/",
        "description": "Мощная открытая модель Meta. Можно использовать бесплатно в некоммерческих и коммерческих (до 700M пользователей) целях.",
        "params": "8B",
        "languages": ["en", "ru"],
        "via": "Ollama / Groq / Together AI",
        "ollama_tag": "llama3",
        "commercial_ok": True,
        "finetune_ok": True,
        "color": "#0064e0",
    },
    {
        "id": "mistral-7b",
        "name": "Mistral 7B Instruct",
        "org": "Mistral AI",
        "license": "Apache 2.0",
        "license_type": "apache2",
        "license_url": "https://www.apache.org/licenses/LICENSE-2.0",
        "description": "Полностью свободная лицензия Apache 2.0. Можно использовать, изменять, дообучать и продавать без ограничений.",
        "params": "7B",
        "languages": ["en", "ru", "fr", "de"],
        "via": "Ollama / Mistral API / HuggingFace",
        "ollama_tag": "mistral",
        "commercial_ok": True,
        "finetune_ok": True,
        "color": "#ff7000",
    },
    {
        "id": "phi3-mini",
        "name": "Microsoft Phi-3 Mini",
        "org": "Microsoft",
        "license": "MIT License",
        "license_type": "mit",
        "license_url": "https://opensource.org/licenses/MIT",
        "description": "Лицензия MIT — самая свободная. Делайте что угодно: изменяйте, дообучайте, продавайте. Только сохраните уведомление об авторских правах.",
        "params": "3.8B",
        "languages": ["en", "ru"],
        "via": "Ollama / Azure AI / HuggingFace",
        "ollama_tag": "phi3",
        "commercial_ok": True,
        "finetune_ok": True,
        "color": "#00a4ef",
    },
    {
        "id": "gemma2-9b",
        "name": "Google Gemma 2 9B",
        "org": "Google",
        "license": "Gemma Terms of Use",
        "license_type": "gemma",
        "license_url": "https://ai.google.dev/gemma/terms",
        "description": "Открытая модель Google. Разрешено дообучение и коммерческое использование при соблюдении условий Google.",
        "params": "9B",
        "languages": ["en", "ru"],
        "via": "Ollama / Google AI Studio",
        "ollama_tag": "gemma2",
        "commercial_ok": True,
        "finetune_ok": True,
        "color": "#4285f4",
    },
    {
        "id": "qwen2-7b",
        "name": "Qwen2 7B",
        "org": "Alibaba Cloud",
        "license": "Apache 2.0",
        "license_type": "apache2",
        "license_url": "https://www.apache.org/licenses/LICENSE-2.0",
        "description": "Китайская открытая модель с Apache 2.0. Отличное качество на русском языке. Полная свобода использования.",
        "params": "7B",
        "languages": ["en", "ru", "zh"],
        "via": "Ollama / HuggingFace",
        "ollama_tag": "qwen2",
        "commercial_ok": True,
        "finetune_ok": True,
        "color": "#ff6a00",
    },
    {
        "id": "deepseek-r1-7b",
        "name": "DeepSeek-R1 7B",
        "org": "DeepSeek AI",
        "license": "MIT License",
        "license_type": "mit",
        "license_url": "https://opensource.org/licenses/MIT",
        "description": "Мощная модель рассуждений MIT-лицензия. Превосходит многие коммерческие модели в логических задачах.",
        "params": "7B",
        "languages": ["en", "ru", "zh"],
        "via": "Ollama / DeepSeek API",
        "ollama_tag": "deepseek-r1",
        "commercial_ok": True,
        "finetune_ok": True,
        "color": "#1d4ed8",
    },
]


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data, code=200):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg})}


def make_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def generate_license_doc(config: dict, model_info: dict, training_count: int) -> str:
    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    return f"""ДЕКЛАРАЦИЯ ОБ ИСПОЛЬЗОВАНИИ И ДООБУЧЕНИИ ОТКРЫТОЙ ИИ-МОДЕЛИ
═══════════════════════════════════════════════════════════════════

ДОКУМЕНТ № {make_hash(config['owner_name'] + now).upper()}
Дата составления: {now}

═══════════════════════════════════════════════════════════════════
РАЗДЕЛ 1. СВЕДЕНИЯ О ПРАВООБЛАДАТЕЛЕ ДООБУЧЕННОЙ МОДЕЛИ
═══════════════════════════════════════════════════════════════════

Владелец производной модели: {config['owner_name']}
Наименование производной модели: {config['model_name']}
Назначение: {config.get('domain', 'general')}
Дата начала дообучения: {now}

═══════════════════════════════════════════════════════════════════
РАЗДЕЛ 2. СВЕДЕНИЯ О БАЗОВОЙ МОДЕЛИ
═══════════════════════════════════════════════════════════════════

Базовая модель: {model_info['name']}
Разработчик базовой модели: {model_info['org']}
Лицензия базовой модели: {model_info['license']}
URL лицензии: {model_info['license_url']}
Параметры модели: {model_info['params']}
Поддерживаемые языки: {', '.join(model_info['languages'])}

═══════════════════════════════════════════════════════════════════
РАЗДЕЛ 3. ПРАВА И ОГРАНИЧЕНИЯ
═══════════════════════════════════════════════════════════════════

Коммерческое использование: {'РАЗРЕШЕНО' if model_info['commercial_ok'] else 'ОГРАНИЧЕНО'}
Дообучение (fine-tuning): {'РАЗРЕШЕНО' if model_info['finetune_ok'] else 'ОГРАНИЧЕНО'}
Распространение производных работ: РАЗРЕШЕНО при соблюдении условий лицензии

Краткое содержание лицензии {model_info['license']}:
{'• Разрешается свободно использовать, изменять и распространять' if model_info['license_type'] in ('mit', 'apache2') else '• Использование разрешено согласно условиям правообладателя'}
{'• Разрешается коммерческое использование без ограничений' if model_info['license_type'] == 'mit' else ''}
{'• Необходимо сохранять уведомление об авторских правах оригинала' if model_info['license_type'] in ('mit', 'apache2') else ''}
{'• Производные работы должны содержать ссылку на оригинальную лицензию' if model_info['license_type'] == 'apache2' else ''}

═══════════════════════════════════════════════════════════════════
РАЗДЕЛ 4. ОПИСАНИЕ ПРОИЗВЕДЁННЫХ ИЗМЕНЕНИЙ (ДООБУЧЕНИЕ)
═══════════════════════════════════════════════════════════════════

Метод адаптации: Instruction Tuning (дообучение на инструкциях)
Количество обучающих примеров добавлено: {training_count}
Системный промпт (специализация модели):
---
{config.get('system_prompt', '(не задан)')}
---
Языковая специализация: {config.get('language', 'ru')}
Предметная область: {config.get('domain', 'general')}
Температура генерации: {config.get('temperature', 0.7)}
Максимум токенов: {config.get('max_tokens', 1024)}

═══════════════════════════════════════════════════════════════════
РАЗДЕЛ 5. ЗАЯВЛЕНИЕ ПРАВООБЛАДАТЕЛЯ
═══════════════════════════════════════════════════════════════════

Я, {config['owner_name']}, настоящим заявляю:

1. Производная модель «{config['model_name']}» создана на основе базовой
   модели «{model_info['name']}» разработки {model_info['org']}.

2. Базовая модель используется в соответствии с лицензией
   «{model_info['license']}», условия которой мне известны и соблюдены.

3. Все изменения, внесённые мной (системные инструкции, обучающие данные,
   настройки), являются моей оригинальной работой.

4. Я не претендую на права на исходную архитектуру и веса базовой модели.
   Моя интеллектуальная собственность — это исключительно внесённые
   мной обучающие данные и конфигурация.

5. Настоящий документ служит подтверждением законного использования
   открытой модели и факта её дообучения.

═══════════════════════════════════════════════════════════════════
РАЗДЕЛ 6. ЗАПРЕТ НА ИСПОЛЬЗОВАНИЕ ДАННЫХ ДЛЯ ОБУЧЕНИЯ ИИ
═══════════════════════════════════════════════════════════════════

Правообладатель, {config['owner_name']}, настоящим устанавливает
следующие обязательные ограничения:

6.1. ПОЛНЫЙ ЗАПРЕТ на использование любых данных, исходящих из настоящей
     системы, приложения или модели «{config['model_name']}», в целях
     обучения, дообучения, тестирования или моделирования любых
     искусственных интеллектуальных систем третьих сторон.

6.2. ЗАПРЕТ распространяется на: обучающие примеры, конфигурации,
     системные промпты, журналы взаимодействий, входные и выходные
     данные модели, метаданные и любую производную информацию.

6.3. Использование данных системы для целей, указанных в п. 6.1,
     без письменного согласия правообладателя является нарушением
     настоящей декларации и может повлечь юридическую ответственность.

═══════════════════════════════════════════════════════════════════
РАЗДЕЛ 7. ПОРЯДОК ПЕРЕДАЧИ И РАССЫЛКИ ИНФОРМАЦИИ
═══════════════════════════════════════════════════════════════════

7.1. Любая передача, рассылка, публикация или иное распространение
     информации, исходящей из настоящей системы «{config['model_name']}»,
     ДОПУСКАЕТСЯ ИСКЛЮЧИТЕЛЬНО после ручного одобрения правообладателя
     ({config['owner_name']}) в каждом конкретном случае.

7.2. Автоматическая или автономная рассылка любых данных системы
     без предварительного ручного подтверждения правообладателем
     СТРОГО ЗАПРЕЩЕНА.

7.3. Правообладатель сохраняет за собой право отозвать или
     аннулировать любое ранее выданное разрешение на передачу данных.

7.4. Настоящие ограничения (п. 7.1–7.3) имеют бессрочное действие
     и распространяются на всех пользователей и операторов системы.

═══════════════════════════════════════════════════════════════════
РАЗДЕЛ 8. КОНТРОЛЬНАЯ СУММА ДОКУМЕНТА
═══════════════════════════════════════════════════════════════════

SHA-256 (конфигурация): {make_hash(json.dumps(config, ensure_ascii=False))}
Временная метка: {int(time.time())}
Сформировано системой: ECSU 2.0 Model Registry

═══════════════════════════════════════════════════════════════════
           ДОКУМЕНТ СФОРМИРОВАН АВТОМАТИЧЕСКИ СИСТЕМОЙ ECSU 2.0
═══════════════════════════════════════════════════════════════════
"""


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            body = {}

    conn = db()
    cur = conn.cursor()

    # GET /models — каталог базовых моделей
    if method == "GET" and "/models" in path:
        conn.close()
        return ok({"models": BASE_MODELS})

    # GET /config — текущая конфигурация
    if method == "GET" and "/config" in path:
        cur.execute(f"SELECT id, base_model_id, model_name, owner_name, system_prompt, temperature, max_tokens, language, domain, updated_at FROM {S}.my_model_config ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        conn.close()
        if row:
            return ok({"config": {"id": row[0], "base_model_id": row[1], "model_name": row[2], "owner_name": row[3], "system_prompt": row[4], "temperature": float(row[5]), "max_tokens": row[6], "language": row[7], "domain": row[8], "updated_at": str(row[9])}})
        return ok({"config": None})

    # POST /config — сохранить конфигурацию
    if method == "POST" and "/config" in path:
        cur.execute(f"""
            INSERT INTO {S}.my_model_config (base_model_id, model_name, owner_name, system_prompt, temperature, max_tokens, language, domain, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NOW())
        """, (
            body.get("base_model_id", "mistral-7b"),
            body.get("model_name", "Моя модель"),
            body.get("owner_name", ""),
            body.get("system_prompt", ""),
            float(body.get("temperature", 0.7)),
            int(body.get("max_tokens", 1024)),
            body.get("language", "ru"),
            body.get("domain", "general"),
        ))
        cur.execute(f"INSERT INTO {S}.model_training_log (action, details, base_model, model_name, owner_name) VALUES (%s,%s,%s,%s,%s)",
                    ("Обновлена конфигурация модели", json.dumps(body, ensure_ascii=False), body.get("base_model_id"), body.get("model_name"), body.get("owner_name")))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # GET /training — список обучающих примеров
    if method == "GET" and "/training" in path and "/log" not in path:
        cur.execute(f"SELECT id, data_type, instruction, response, category, quality_score, is_active, created_at FROM {S}.model_training_data WHERE is_active=true ORDER BY created_at DESC")
        rows = [{"id": r[0], "data_type": r[1], "instruction": r[2], "response": r[3], "category": r[4], "quality_score": r[5], "is_active": r[6], "created_at": str(r[7])} for r in cur.fetchall()]
        conn.close()
        return ok({"data": rows, "total": len(rows)})

    # POST /training — добавить обучающий пример
    if method == "POST" and "/training" in path and "/log" not in path:
        instruction = body.get("instruction", "").strip()
        response = body.get("response", "").strip()
        if not instruction or not response:
            conn.close()
            return err("instruction и response обязательны")
        cur.execute(f"""
            INSERT INTO {S}.model_training_data (data_type, instruction, response, category, quality_score)
            VALUES (%s,%s,%s,%s,%s) RETURNING id
        """, (body.get("data_type", "instruction"), instruction, response, body.get("category", "general"), int(body.get("quality_score", 5))))
        new_id = cur.fetchone()[0]
        cur.execute(f"INSERT INTO {S}.model_training_log (action, details) VALUES (%s,%s)",
                    ("Добавлен обучающий пример", f"#{new_id}: {instruction[:80]}"))
        conn.commit()
        conn.close()
        return ok({"ok": True, "id": new_id}, 201)

    # DELETE /training — удалить пример
    if method == "DELETE" and "/training" in path:
        params = event.get("queryStringParameters") or {}
        tid = params.get("id")
        if tid:
            cur.execute(f"UPDATE {S}.model_training_data SET is_active=false WHERE id=%s", (int(tid),))
            cur.execute(f"INSERT INTO {S}.model_training_log (action, details) VALUES (%s,%s)", ("Удалён обучающий пример", f"ID={tid}"))
            conn.commit()
        conn.close()
        return ok({"ok": True})

    # GET /log — журнал
    if method == "GET" and "/log" in path:
        cur.execute(f"SELECT id, action, details, base_model, model_name, owner_name, created_at FROM {S}.model_training_log ORDER BY created_at DESC LIMIT 100")
        rows = [{"id": r[0], "action": r[1], "details": r[2], "base_model": r[3], "model_name": r[4], "owner_name": r[5], "created_at": str(r[6])} for r in cur.fetchall()]
        conn.close()
        return ok({"log": rows})

    # POST /document — сгенерировать юридический документ
    if method == "POST" and "/document" in path:
        cur.execute(f"SELECT base_model_id, model_name, owner_name, system_prompt, temperature, max_tokens, language, domain FROM {S}.my_model_config ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Сначала сохраните конфигурацию модели")
        config = {"base_model_id": row[0], "model_name": row[1], "owner_name": row[2], "system_prompt": row[3], "temperature": float(row[4]), "max_tokens": row[5], "language": row[6], "domain": row[7]}
        model_info = next((m for m in BASE_MODELS if m["id"] == config["base_model_id"]), BASE_MODELS[1])
        cur.execute(f"SELECT COUNT(*) FROM {S}.model_training_data WHERE is_active=true")
        training_count = cur.fetchone()[0]
        content = generate_license_doc(config, model_info, training_count)
        doc_hash = make_hash(content)
        cur.execute(f"""
            INSERT INTO {S}.model_documents (doc_type, title, content, base_model, model_name, owner_name, doc_hash)
            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, ("license_declaration", f"Декларация — {config['model_name']}", content, config["base_model_id"], config["model_name"], config["owner_name"], doc_hash))
        doc_id = cur.fetchone()[0]
        cur.execute(f"INSERT INTO {S}.model_training_log (action, details, base_model, model_name, owner_name, document_hash) VALUES (%s,%s,%s,%s,%s,%s)",
                    ("Сформирован юридический документ", f"Декларация #{doc_id}", config["base_model_id"], config["model_name"], config["owner_name"], doc_hash))
        conn.commit()
        conn.close()
        return ok({"ok": True, "id": doc_id, "content": content, "hash": doc_hash})

    # GET /documents — список документов
    if method == "GET" and "/document" in path:
        cur.execute(f"SELECT id, doc_type, title, base_model, model_name, owner_name, doc_hash, created_at FROM {S}.model_documents ORDER BY created_at DESC")
        rows = [{"id": r[0], "doc_type": r[1], "title": r[2], "base_model": r[3], "model_name": r[4], "owner_name": r[5], "doc_hash": r[6], "created_at": str(r[7])} for r in cur.fetchall()]
        conn.close()
        return ok({"documents": rows})

    conn.close()
    return ok({"models": BASE_MODELS})