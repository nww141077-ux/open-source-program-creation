"""
Голосовой модуль ЕГСУ — Яндекс SpeechKit
Речь → текст (STT) и текст → речь (TTS)
Координатор может голосом управлять дашбордом
"""
import json
import os
import base64
import urllib.request
import urllib.error

HEADERS_BASE = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
}

YANDEX_STT_URL = "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize"
YANDEX_TTS_URL = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize"

# Голосовые команды ЕГСУ
VOICE_COMMANDS = {
    "критические": {"action": "filter", "value": "critical", "response": "Показываю критические инциденты"},
    "активные": {"action": "filter", "value": "active", "response": "Показываю активные инциденты"},
    "расследование": {"action": "filter", "value": "investigating", "response": "Показываю инциденты в расследовании"},
    "решённые": {"action": "filter", "value": "resolved", "response": "Показываю решённые инциденты"},
    "все инциденты": {"action": "filter", "value": "all", "response": "Показываю все инциденты"},
    "статистика": {"action": "tab", "value": "overview", "response": "Открываю обзор системы"},
    "обзор": {"action": "tab", "value": "overview", "response": "Открываю обзор системы"},
    "инциденты": {"action": "tab", "value": "incidents", "response": "Открываю список инцидентов"},
    "аналитика": {"action": "tab", "value": "ai", "response": "Открываю раздел ИИ-аналитики"},
    "органы": {"action": "tab", "value": "organs", "response": "Открываю органы ЕГСУ"},
    "новый инцидент": {"action": "navigate", "value": "/egsu/report", "response": "Открываю форму подачи инцидента"},
    "подать": {"action": "navigate", "value": "/egsu/report", "response": "Открываю форму подачи инцидента"},
    "главная": {"action": "navigate", "value": "/egsu", "response": "Возвращаю на главную страницу"},
    "помощь": {"action": "help", "value": "", "response": "Доступные команды: критические, активные, расследование, статистика, инциденты, аналитика, органы, новый инцидент"},
}

def parse_command(text: str):
    text_lower = text.lower()
    for keyword, cmd in VOICE_COMMANDS.items():
        if keyword in text_lower:
            return cmd
    return {"action": "unknown", "value": "", "response": "Команда не распознана. Скажите 'помощь' для списка команд"}

def stt_yandex(audio_b64: str, api_key: str) -> str:
    audio_bytes = base64.b64decode(audio_b64)
    req = urllib.request.Request(
        YANDEX_STT_URL + "?lang=ru-RU&format=lpcm&sampleRateHertz=16000",
        data=audio_bytes,
        headers={"Authorization": f"Api-Key {api_key}", "Content-Type": "application/octet-stream"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        result = json.loads(resp.read())
        return result.get("result", "")

def tts_yandex(text: str, api_key: str) -> str:
    params = urllib.parse.urlencode({
        "text": text, "lang": "ru-RU", "voice": "alena",
        "emotion": "neutral", "speed": "1.0", "format": "mp3"
    }).encode()
    req = urllib.request.Request(
        YANDEX_TTS_URL,
        data=params,
        headers={"Authorization": f"Api-Key {api_key}", "Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return base64.b64encode(resp.read()).decode()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS_BASE, 'body': ''}

    import urllib.parse

    api_key = os.environ.get('YANDEX_SPEECHKIT_API_KEY', '')
    body = json.loads(event.get('body') or '{}')
    mode = body.get('mode', 'command')  # command | tts | stt

    # Режим: только распознать команду из текста (без ключа)
    if mode == 'command':
        text = body.get('text', '')
        cmd = parse_command(text)
        return {'statusCode': 200, 'headers': HEADERS_BASE, 'body': json.dumps({
            'recognized_text': text,
            'command': cmd,
        }, ensure_ascii=False)}

    if not api_key:
        return {'statusCode': 503, 'headers': HEADERS_BASE, 'body': json.dumps({
            'error': 'Yandex SpeechKit API key not configured'
        }, ensure_ascii=False)}

    # Режим: речь → текст → команда
    if mode == 'stt':
        audio_b64 = body.get('audio_base64', '')
        try:
            text = stt_yandex(audio_b64, api_key)
            cmd = parse_command(text)
            return {'statusCode': 200, 'headers': HEADERS_BASE, 'body': json.dumps({
                'recognized_text': text,
                'command': cmd,
            }, ensure_ascii=False)}
        except Exception as e:
            return {'statusCode': 500, 'headers': HEADERS_BASE, 'body': json.dumps({'error': str(e)}, ensure_ascii=False)}

    # Режим: текст → речь
    if mode == 'tts':
        text = body.get('text', '')
        try:
            audio_b64 = tts_yandex(text, api_key)
            return {'statusCode': 200, 'headers': HEADERS_BASE, 'body': json.dumps({
                'audio_base64': audio_b64,
                'format': 'mp3'
            }, ensure_ascii=False)}
        except Exception as e:
            return {'statusCode': 500, 'headers': HEADERS_BASE, 'body': json.dumps({'error': str(e)}, ensure_ascii=False)}

    return {'statusCode': 400, 'headers': HEADERS_BASE, 'body': json.dumps({'error': 'Unknown mode'})}
