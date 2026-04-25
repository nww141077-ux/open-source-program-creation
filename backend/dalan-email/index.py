import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime


def handler(event: dict, context) -> dict:
    """Отправка email-уведомлений от ЕЦСУ на адрес разработчика."""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    if event.get("httpMethod") == "GET":
        return {
            "statusCode": 200,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"status": "ok", "service": "ЕЦСУ Email Service v1.0"}),
        }

    body = json.loads(event.get("body") or "{}")
    email_type = body.get("type", "custom")
    subject = body.get("subject", "")
    custom_message = body.get("message", "")
    sender_name = body.get("sender_name", "Николаев Владимир Владимирович")

    to_email = "nikolaevvladimir77@yandex.ru"
    from_email = "nikolaevvladimir77@yandex.ru"
    smtp_password = os.environ.get("YANDEX_SMTP_PASSWORD", "")

    now = datetime.now().strftime("%d.%m.%Y %H:%M:%S")

    templates = {
        "device_online": {
            "subject": "✅ ЕЦСУ: Новое устройство подключено",
            "body": f"""<h2 style="color:#6366f1">ЕЦСУ — Уведомление о подключении</h2>
<p>Новое устройство успешно подключено к кластеру <b>ЕЦСУ</b>.</p>
<p><b>Время:</b> {now}</p>
<hr><p style="color:#888;font-size:12px">Единая Центральная Система Управления · ЕЦСУ 2.0</p>""",
        },
        "limit_warning": {
            "subject": "⚠️ ЕЦСУ: Достигнут лимит функций",
            "body": f"""<h2 style="color:#f59e0b">ЕЦСУ — Предупреждение о лимите</h2>
<p>Использование функций достигло критического уровня: <b>23 / 25</b>.</p>
<p>Рекомендуется оптимизировать или расширить лимиты.</p>
<p><b>Время:</b> {now}</p>
<hr><p style="color:#888;font-size:12px">Единая Центральная Система Управления · ЕЦСУ 2.0</p>""",
        },
        "backup_done": {
            "subject": "💾 ЕЦСУ: Резервное копирование завершено",
            "body": f"""<h2 style="color:#22c55e">ЕЦСУ — Резервное копирование</h2>
<p>Ежедневное резервное копирование кластера ЕЦСУ успешно завершено.</p>
<p><b>Время:</b> {now}</p>
<p><b>Статус:</b> Все узлы сохранены (pc-main, phone-1, phone-2)</p>
<hr><p style="color:#888;font-size:12px">Единая Центральная Система Управления · ЕЦСУ 2.0</p>""",
        },
        "device_offline": {
            "subject": "🔴 ЕЦСУ: Устройство офлайн",
            "body": f"""<h2 style="color:#ef4444">ЕЦСУ — Срочное уведомление</h2>
<p>Одно из устройств кластера <b>ЕЦСУ</b> потеряло связь.</p>
<p>Требуется проверка подключения.</p>
<p><b>Время:</b> {now}</p>
<hr><p style="color:#888;font-size:12px">Единая Центральная Система Управления · ЕЦСУ 2.0</p>""",
        },
        "low_energy": {
            "subject": "⚡ ЕЦСУ: Низкий уровень энергии",
            "body": f"""<h2 style="color:#f43f5e">ЕЦСУ — Предупреждение об энергии</h2>
<p>Уровень энергии кластера достиг критического значения.</p>
<p>Необходимо принять меры по оптимизации потребления.</p>
<p><b>Время:</b> {now}</p>
<hr><p style="color:#888;font-size:12px">Единая Центральная Система Управления · ЕЦСУ 2.0</p>""",
        },
        "bios_case": {
            "subject": "🖥️ ЕЦСУ: Кейс ИИ-модуля «Далан 1» для конструктора",
            "body": f"""<h2 style="color:#6366f1">Кейс ИИ-модуль «Далан 1» — BIOS/UEFI</h2>
<p><b>Разработчик:</b> {sender_name}</p>
<p><b>Дата:</b> {now}</p>
<hr>
<h3>Состав кейса dalan_1_bios_ai/</h3>
<ul>
  <li><b>README.md</b> — краткая инструкция (5 минут на чтение)</li>
  <li><b>dalan1_core.c</b> — основной код ИИ-модуля (&lt; 10 КБ)</li>
  <li><b>dalan1_core.h</b> — заголовочный файл, структуры power_state, sensor_data</li>
  <li><b>dalan1_model.tflite</b> — обученная модель ИИ (&lt; 5 КБ, TFLite Micro)</li>
  <li><b>bios_integration.c</b> — интеграция в POST BIOS</li>
  <li><b>autostart/setup_dalan1.sh</b> — скрипт установки</li>
  <li><b>autostart/autostart_dalan1.sh</b> — скрипт автозапуска</li>
  <li><b>docs/energy_optimization_guide.md</b> — руководство по оптимизации</li>
</ul>
<hr>
<h3>Инструкция для конструктора</h3>
<pre style="background:#f5f5f5;padding:10px;font-size:12px">
# 1. Скопировать файлы в проект coreboot
cp dalan_1_bios_ai/* /path/to/your/bios/project/

# 2. Включить модуль в .config
CONFIG_DALAN1_AI=y

# 3. Собрать прошивку
make

# 4. Тестирование (эмуляция)
qemu-system-x86_64 -bios build/bios.rom

# 5. Резервная копия перед записью
flashrom -r backup.rom
</pre>
<h3>Ключевые результаты</h3>
<ul>
  <li>Снижение энергопотребления: <b>10–25 %</b></li>
  <li>Быстрая инициализация: <b>&lt; 1 секунды</b></li>
  <li>Общий размер модуля: <b>&lt; 15 КБ</b></li>
  <li>Вызовы модели: каждые <b>5 секунд</b> (адаптивно)</li>
</ul>
<p>Программатор для записи: <b>CH341A</b> или <b>TL866II+</b></p>
<hr><p style="color:#888;font-size:12px">Единая Центральная Система Управления · ЕЦСУ 2.0 · © 2026 {sender_name}</p>""",
        },
        "bot_case": {
            "subject": "🤖 ЕЦСУ: Кейс бота Яндекс Алиса + MAX для конструктора",
            "body": f"""<h2 style="color:#6366f1">Кейс мультиплатформенного бота — Яндекс Алиса &amp; MAX</h2>
<p><b>Разработчик:</b> {sender_name}</p>
<p><b>Дата:</b> {now}</p>
<hr>
<h3>Архив: bot_constructor.zip</h3>
<h4>Структура папки bot_constructor/</h4>
<ul>
  <li><b>configs/yandex.json</b> — webhook_url, oauth_token, skill_id</li>
  <li><b>configs/max.json</b> — bot_token, api_url, webhook_url</li>
  <li><b>adapters/adapter_yandex.js</b> — адаптер Яндекс Диалоги</li>
  <li><b>adapters/adapter_max.js</b> — адаптер MAX</li>
  <li><b>adapters/adapter_base.js</b> — базовый класс адаптера</li>
  <li><b>logic/bot_logic.js</b> — основная логика обработки</li>
  <li><b>logic/dialogs.json</b> — сценарии диалогов (приветствия, прощания)</li>
  <li><b>platform_selector.js</b> — выбор адаптера по платформе</li>
  <li><b>webhook_handler.js</b> — обработчик входящих запросов</li>
  <li><b>server.js</b> — Express-сервер, порт 3000</li>
  <li><b>package.json</b> — express ^4.18.2, dotenv ^16.3.1</li>
  <li><b>README.md</b> — инструкция по развёртыванию</li>
</ul>
<hr>
<h3>Инструкция для конструктора</h3>
<pre style="background:#f5f5f5;padding:10px;font-size:12px">
1. git clone [ссылка]
2. npm install
3. Настройте configs/yandex.json и configs/max.json (токены, URL)
4. node server.js
5. Подключите webhook в Яндекс Диалоги и MAX
6. Протестируйте бота через платформы
</pre>
<h3>Дополнительно (опционально)</h3>
<ul>
  <li>logs.js — логирование запросов</li>
  <li>tests/ — юнит-тесты</li>
  <li>docker-compose.yml — контейнеризация</li>
</ul>
<hr><p style="color:#888;font-size:12px">Единая Центральная Система Управления · ЕЦСУ 2.0 · © 2026 {sender_name}</p>""",
        },
        "custom": {
            "subject": subject or "Сообщение от ЕЦСУ",
            "body": f"""<h2 style="color:#6366f1">ЕЦСУ — Сообщение</h2>
<p>{custom_message}</p>
<p><b>От:</b> {sender_name}</p>
<p><b>Время:</b> {now}</p>
<hr><p style="color:#888;font-size:12px">Единая Центральная Система Управления · ЕЦСУ 2.0</p>""",
        },
    }

    tpl = templates.get(email_type, templates["custom"])
    final_subject = tpl["subject"]
    final_body = tpl["body"]

    msg = MIMEMultipart("alternative")
    msg["Subject"] = final_subject
    msg["From"] = f"ЕЦСУ Система <{from_email}>"
    msg["To"] = to_email

    msg.attach(MIMEText(final_body, "html", "utf-8"))

    if not smtp_password:
        return {
            "statusCode": 503,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"ok": False, "error": "SMTP пароль не настроен. Добавьте секрет YANDEX_SMTP_PASSWORD."}),
        }

    with smtplib.SMTP_SSL("smtp.yandex.ru", 465) as server:
        server.login(from_email, smtp_password)
        server.send_message(msg)

    return {
        "statusCode": 200,
        "headers": {**cors_headers, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "to": to_email, "subject": final_subject, "sent_at": now}),
    }