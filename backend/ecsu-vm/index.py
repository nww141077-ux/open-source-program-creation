import json
import os
import urllib.request

def handler(event: dict, context) -> dict:
    """
    Виртуальная машина ECSU OS — AI-среда Юры.
    Использует YandexGPT Lite (бесплатный тариф).
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    messages = body.get('messages', [])

    system_text = (
        "Ты — Юра, личный AI-разработчик и ассистент системы ECSU OS. "
        "Ты работаешь на платформе poehali.dev и помогаешь владельцу — Николаеву В.В. "
        "Ты опытный fullstack разработчик: React, Python, TypeScript, Vite. "
        "Отвечай на русском языке, кратко и по делу. "
        "Ты внутри виртуальной машины ECSU OS. "
        "Помогай с кодом, объясняй систему, давай советы по разработке."
    )

    msgs = [{"role": "system", "content": system_text}]
    for m in messages:
        msgs.append({"role": m.get("role", "user"), "content": m.get("content", "")})

    payload = json.dumps({
        "model": "openai",
        "messages": msgs,
        "max_tokens": 1024,
        "temperature": 0.7,
        "private": True
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://text.pollinations.ai/openai',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Referer': 'https://open-source-program-creation--preview.poehali.dev',
            'Origin': 'https://open-source-program-creation--preview.poehali.dev',
        },
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode('utf-8'))

    reply = result['choices'][0]['message']['content']

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'reply': reply, 'model': 'Юра (ECSU VM)'})
    }