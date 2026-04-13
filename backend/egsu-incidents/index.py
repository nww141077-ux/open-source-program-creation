"""
API управления инцидентами ЕГСУ 2.0
Николаев Владимир Владимирович — контрольный пакет акций
Поддерживает: создание, верификацию, расследование, применение действий, получение списка
"""
import json
import os
import random
import string
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
    'Content-Type': 'application/json'
}

# Алгоритм верификации по принципам МГП
VERIFICATION_WEIGHTS = {
    'has_photo': 20,
    'has_video': 25,
    'has_witnesses': 20,
    'has_satellite': 25,
    'has_official_source': 30,
    'mgp_distinction': 15,
    'mgp_proportionality': 15,
    'mgp_necessity': 15,
}

# Ответственные органы по типу инцидента
RESPONSIBLE_ORGANS = {
    'ecology': 'ОГР-Экология',
    'water': 'ОГР-Водные ресурсы',
    'air': 'ОГР-Атмосфера',
    'cyber': 'ОГР-Киберзащита',
    'human_rights': 'ОГР-Права человека',
    'weapons': 'ОГР-Вооружения',
}

# Автоматические действия по типу нарушения (по регламенту ЕГСУ Раздел 5)
AUTO_ACTIONS = {
    'ecology': [
        {'code': 'ogr_deploy', 'label': 'Развёртывание ОГР на место инцидента', 'legal_basis': 'Регламент ЕГСУ, Шаг 1'},
        {'code': 'satellite_monitor', 'label': 'Активация спутникового мониторинга зоны', 'legal_basis': 'Конвенция о биологическом разнообразии, ст. 14'},
        {'code': 'notify_env_auth', 'label': 'Уведомление природоохранных органов страны', 'legal_basis': 'Орхусская конвенция, ст. 5'},
        {'code': 'eco_fund_reserve', 'label': 'Резервирование средств Экологического фонда', 'legal_basis': 'Регламент ЕГСУ, Раздел 5'},
    ],
    'water': [
        {'code': 'ogr_deploy', 'label': 'Развёртывание ОГР на место инцидента', 'legal_basis': 'Регламент ЕГСУ, Шаг 1'},
        {'code': 'water_samples', 'label': 'Запрос независимых проб воды', 'legal_basis': 'Водная рамочная директива ЮНЕП'},
        {'code': 'downstream_alert', 'label': 'Оповещение населения в зоне загрязнения', 'legal_basis': 'Протокол защиты населения ЕГСУ, ст. 8'},
        {'code': 'marpol_activate', 'label': 'Активация протокола МАРПОЛ', 'legal_basis': 'Конвенция МАРПОЛ 73/78'},
    ],
    'air': [
        {'code': 'ogr_deploy', 'label': 'Развёртывание ОГР на место инцидента', 'legal_basis': 'Регламент ЕГСУ, Шаг 1'},
        {'code': 'air_sensors', 'label': 'Активация сети датчиков качества воздуха', 'legal_basis': 'Директива 2008/50/EC'},
        {'code': 'health_alert', 'label': 'Медицинское оповещение населения', 'legal_basis': 'Протокол ВОЗ / ЕГСУ'},
        {'code': 'paris_notify', 'label': 'Уведомление в рамках Парижского соглашения', 'legal_basis': 'Парижское соглашение, ст. 13'},
    ],
    'cyber': [
        {'code': 'isolate', 'label': 'Рекомендация немедленной изоляции систем', 'legal_basis': 'Директива NIS2 ЕС'},
        {'code': 'cert_notify', 'label': 'Уведомление национального CERT', 'legal_basis': 'ISO/IEC 27035'},
        {'code': 'trace_attack', 'label': 'Запуск протокола трассировки атаки', 'legal_basis': 'Будапештская конвенция'},
        {'code': 'parliament_alert', 'label': 'Экстренное оповещение МПСТУ', 'legal_basis': 'Регламент ЕГСУ, Раздел 4'},
    ],
    'human_rights': [
        {'code': 'ogr_deploy', 'label': 'Развёртывание ОГР-наблюдателей', 'legal_basis': 'Устав ООН, ст. 55'},
        {'code': 'social_fund', 'label': 'Резервирование Социального фонда', 'legal_basis': 'Регламент ЕГСУ, Раздел 5'},
        {'code': 'ms_referral', 'label': 'Передача материалов в МС ЕГСУ', 'legal_basis': 'Статут МС ЕГСУ, ст. 7'},
        {'code': 'ngo_alert', 'label': 'Оповещение НКО в регионе', 'legal_basis': 'Орхусская конвенция'},
    ],
    'weapons': [
        {'code': 'sbr_deploy', 'label': 'Запрос санкции ГСБ на развёртывание СБР', 'legal_basis': 'Регламент ЕГСУ, Шаг 1 + решение МС'},
        {'code': 'asset_freeze', 'label': 'Инициирование заморозки активов виновных', 'legal_basis': 'Регламент ЕГСУ, Раздел 5'},
        {'code': 'ms_urgent', 'label': 'Срочное заседание МС (в течение 24 часов)', 'legal_basis': 'Статут МС ЕГСУ, ст. 9'},
        {'code': 'blockchain_record', 'label': 'Запись в блокчейн-реестр нарушений', 'legal_basis': 'Регламент ЕГСУ, Раздел 4'},
    ],
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def calc_verification(data: dict) -> int:
    score = 0
    for field, weight in VERIFICATION_WEIGHTS.items():
        if data.get(field):
            score += weight
    return min(score, 100)

def gen_code():
    suffix = ''.join(random.choices(string.digits, k=4))
    return f'INC-{suffix}'

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    params = event.get('queryStringParameters') or {}

    # GET /egsu-incidents — список инцидентов
    if method == 'GET' and not path.endswith('/action') and not path.endswith('/verify'):
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        status_filter = params.get('status', '')
        type_filter = params.get('type', '')
        limit = int(params.get('limit', 50))

        query = 'SELECT * FROM egsu_incidents WHERE 1=1'
        args = []
        if status_filter:
            query += ' AND status = %s'
            args.append(status_filter)
        if type_filter:
            query += ' AND type = %s'
            args.append(type_filter)
        query += ' ORDER BY created_at DESC LIMIT %s'
        args.append(limit)

        cur.execute(query, args)
        incidents = cur.fetchall()

        # Подтягиваем действия
        result = []
        for inc in incidents:
            cur.execute('SELECT * FROM egsu_incident_actions WHERE incident_id = %s ORDER BY applied_at', (inc['id'],))
            actions = cur.fetchall()
            row = dict(inc)
            row['actions'] = [dict(a) for a in actions]
            result.append(row)

        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(result, default=str)}

    # POST /egsu-incidents — создать инцидент с верификацией
    if method == 'POST' and not path.endswith('/action') and not path.endswith('/verify'):
        body = json.loads(event.get('body') or '{}')

        # Верификация по МГП
        score = calc_verification(body)
        if score < 40:
            return {
                'statusCode': 422,
                'headers': HEADERS,
                'body': json.dumps({
                    'error': 'Инцидент отклонён системой верификации ЕГСУ',
                    'reason': 'Недостаточно доказательств. Минимальный балл: 40. Ваш балл: ' + str(score),
                    'required': 'Предоставьте фото/видео, данные свидетелей или официальный источник',
                    'score': score
                }, ensure_ascii=False)
            }

        code = gen_code()
        responsible = RESPONSIBLE_ORGANS.get(body.get('type', ''), 'ОГР-Общий')
        ai_confidence = min(score + random.randint(0, 15), 99)
        now = datetime.now()
        step2_deadline = now + timedelta(days=7)
        step3_deadline = now + timedelta(days=21)

        status = 'verified' if score >= 60 else 'pending_verification'

        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            INSERT INTO egsu_incidents
            (incident_code, type, title, description, country, location, severity, status,
             verification_score, has_photo, has_video, has_witnesses, has_satellite, has_official_source,
             mgp_distinction, mgp_proportionality, mgp_necessity,
             responsible_organ, contact_email, is_anonymous, ai_confidence,
             step1_at, step2_deadline, step3_deadline)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING *
        ''', (
            code, body.get('type'), body.get('title'), body.get('description'),
            body.get('country'), body.get('location'), body.get('severity'), status,
            score,
            body.get('has_photo', False), body.get('has_video', False),
            body.get('has_witnesses', False), body.get('has_satellite', False),
            body.get('has_official_source', False),
            body.get('mgp_distinction', False), body.get('mgp_proportionality', False),
            body.get('mgp_necessity', False),
            responsible, body.get('contact_email'), body.get('is_anonymous', False),
            ai_confidence, now, step2_deadline, step3_deadline
        ))
        incident = dict(cur.fetchone())

        # Автоматически применяем действия если верифицирован
        applied_actions = []
        if status == 'verified':
            actions = AUTO_ACTIONS.get(body.get('type', ''), [])
            for act in actions:
                cur.execute('''
                    INSERT INTO egsu_incident_actions (incident_id, action_code, action_label, legal_basis)
                    VALUES (%s, %s, %s, %s) RETURNING *
                ''', (incident['id'], act['code'], act['label'], act['legal_basis']))
                applied_actions.append(dict(cur.fetchone()))

        conn.commit()
        conn.close()

        return {
            'statusCode': 201,
            'headers': HEADERS,
            'body': json.dumps({
                'incident': incident,
                'actions_applied': applied_actions,
                'verification_score': score,
                'status': status,
                'message': 'Инцидент верифицирован и зарегистрирован в системе ЕГСУ' if status == 'verified' else 'Инцидент принят на проверку'
            }, default=str, ensure_ascii=False)
        }

    # POST /egsu-incidents/action — применить действие к инциденту
    if method == 'POST' and path.endswith('/action'):
        body = json.loads(event.get('body') or '{}')
        incident_id = body.get('incident_id')
        action_code = body.get('action_code')
        action_label = body.get('action_label')
        legal_basis = body.get('legal_basis', '')

        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            INSERT INTO egsu_incident_actions (incident_id, action_code, action_label, legal_basis)
            VALUES (%s, %s, %s, %s) RETURNING *
        ''', (incident_id, action_code, action_label, legal_basis))
        action = dict(cur.fetchone())
        conn.commit()
        conn.close()

        return {'statusCode': 201, 'headers': HEADERS, 'body': json.dumps(action, default=str, ensure_ascii=False)}

    return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Not found'})}
