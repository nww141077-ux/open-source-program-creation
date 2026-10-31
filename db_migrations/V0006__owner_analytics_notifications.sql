-- Профиль владельца (без личных данных — только настройки системы)
CREATE TABLE t_p38294978_open_source_program_.egsu_owner_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(30) DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Уведомления системы
CREATE TABLE t_p38294978_open_source_program_.egsu_notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  title VARCHAR(255) NOT NULL,
  body TEXT,
  source VARCHAR(100),
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Отчёты и аналитика
CREATE TABLE t_p38294978_open_source_program_.egsu_analytics_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  total_balance_usd NUMERIC(15,2) DEFAULT 0,
  total_income_usd NUMERIC(15,2) DEFAULT 0,
  total_outcome_usd NUMERIC(15,2) DEFAULT 0,
  absorption_balance NUMERIC(15,2) DEFAULT 0,
  security_events_count INTEGER DEFAULT 0,
  penalties_collected NUMERIC(15,2) DEFAULT 0,
  active_accounts INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Лог доступа владельца
CREATE TABLE t_p38294978_open_source_program_.egsu_access_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  ip_address VARCHAR(64),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Стартовые настройки
INSERT INTO t_p38294978_open_source_program_.egsu_owner_settings (setting_key, setting_value, setting_type, description) VALUES
  ('system_name', 'ЕЦСУ 2.0', 'string', 'Название системы'),
  ('owner_display_name', 'Николаев Владимир Владимирович', 'string', 'Отображаемое имя владельца'),
  ('notifications_enabled', 'true', 'boolean', 'Включить уведомления'),
  ('security_alerts', 'true', 'boolean', 'Уведомления об атаках'),
  ('finance_alerts', 'true', 'boolean', 'Уведомления о финансах'),
  ('auto_block_ip', 'true', 'boolean', 'Автоблокировка атакующих IP'),
  ('absorption_mode', 'true', 'boolean', 'Режим поглощения активен'),
  ('export_format', 'json', 'string', 'Формат экспорта данных'),
  ('timezone', 'Europe/Moscow', 'string', 'Часовой пояс'),
  ('currency_primary', 'USD', 'string', 'Основная валюта'),
  ('two_factor_enabled', 'false', 'boolean', 'Двухфакторная аутентификация'),
  ('session_timeout_minutes', '60', 'number', 'Таймаут сессии (минут)');

-- Демо-уведомления
INSERT INTO t_p38294978_open_source_program_.egsu_notifications (type, priority, title, body, source, action_url) VALUES
  ('security', 'critical', 'Кибератака заблокирована', 'DDoS-атака с IP 94.102.49.190 отражена. Штраф $2500 начислен на счёт поглощения.', 'EGSU Security', '/egsu/security'),
  ('finance', 'high', 'Получено $4150 штрафных средств', 'Счёт поглощения EGSU-ABS-9999 пополнен. Доступен вывод.', 'Absorption Mode', '/egsu/security'),
  ('system', 'normal', 'Система работает штатно', 'Все модули ЕЦСУ 2.0 активны. Защита включена.', 'EGSU Core', '/egsu/dashboard'),
  ('security', 'high', 'Брутфорс заблокирован', '847 попыток подбора пароля с IP 91.108.4.0. IP внесён в блок-лист.', 'EGSU Security', '/egsu/security'),
  ('finance', 'normal', 'Резервный фонд активен', 'Баланс резервного фонда: $380,000. Распределение работает.', 'EGSU Finance', '/egsu/finance');

-- Первый снапшот аналитики
INSERT INTO t_p38294978_open_source_program_.egsu_analytics_snapshots 
  (snapshot_date, total_balance_usd, total_income_usd, total_outcome_usd, absorption_balance, security_events_count, penalties_collected, active_accounts, notes)
VALUES
  (CURRENT_DATE, 1854150.00, 1860000.00, 5850.00, 4150.00, 5, 4150.00, 5, 'Первый автоматический снапшот');
