
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.ark_servers (
    id SERIAL PRIMARY KEY,
    server_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT DEFAULT '',
    server_group VARCHAR(32) DEFAULT 'free',
    connection_url TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.ark_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(64) UNIQUE NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.ark_logs (
    id SERIAL PRIMARY KEY,
    event VARCHAR(128) NOT NULL,
    user_id VARCHAR(64) DEFAULT 'owner',
    details TEXT DEFAULT '',
    ip_address VARCHAR(64) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p38294978_open_source_program_.ark_settings (key, value) VALUES
  ('system_mode',        'online'),
  ('default_mode',       'online'),
  ('default_server_id',  'ecsu-core-1'),
  ('auto_failover',      'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO t_p38294978_open_source_program_.ark_servers (server_id, name, description, server_group, connection_url, is_active) VALUES
  ('ecsu-core-1',   'ECSU Core Server 1',   'Основной сервер инцидентов',          'free', 'https://functions.poehali.dev/c71047de-6e10-499a-aa1c-e9fdba33e7bd', true),
  ('ecsu-ai-1',     'ECSU AI Server',        'ИИ-модуль и правовой анализ',         'free', 'https://functions.poehali.dev/daefa87e-0693-4de5-9191-bbc918e1d241', true),
  ('ecsu-scanner',  'Incident Scanner',      'Сканер из открытых источников',       'free', 'https://functions.poehali.dev/b3ae5ea9-0780-4337-b7b0-e19f144a63fb', true),
  ('ecsu-gateway',  'Public Gateway',        'Публичный API-шлюз системы',          'free', 'https://functions.poehali.dev/417cb87f-8717-4563-a698-6e3f5bb17500', true),
  ('ecsu-legal',    'Legal Base Server',     'База правовых норм',                  'free', 'https://functions.poehali.dev/7425192d-b613-4c55-bdb8-01479a9f0d24', true),
  ('ecsu-sec-1',    'Security & Absorption', 'Модуль безопасности и поглощения',    'premium', 'https://functions.poehali.dev/15640332-461b-47d1-b024-8fa25fb344ef', true),
  ('ecsu-finance',  'Finance Module',        'Финансовый учёт и транзакции',        'premium', 'https://functions.poehali.dev/e610af8a-f8c5-4c04-8d9b-092391fb0c70', true),
  ('ecsu-sms',      'SMS Monitor',           'Уведомления и мониторинг связи',      'premium', 'https://functions.poehali.dev/65523c0c-db23-4d8b-9c7e-6bae200b3318', true)
ON CONFLICT (server_id) DO NOTHING;

INSERT INTO t_p38294978_open_source_program_.ark_logs (event, user_id, details) VALUES
  ('system_initialized', 'owner', 'Ковчег инициализирован. ECSU 2.0 запущена.');
