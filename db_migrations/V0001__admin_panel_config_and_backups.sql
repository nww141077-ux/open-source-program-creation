
-- Расширяем app_settings: добавляем больше настроек системы
ALTER TABLE t_p38294978_open_source_program_.app_settings 
ADD COLUMN IF NOT EXISTS category varchar(100) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS label varchar(200);

-- Обновляем существующие записи
UPDATE t_p38294978_open_source_program_.app_settings SET label='Название системы', category='interface' WHERE key='app_name';
UPDATE t_p38294978_open_source_program_.app_settings SET label='Логотип', category='interface' WHERE key='logo_path';
UPDATE t_p38294978_open_source_program_.app_settings SET label='Цвет темы', category='interface' WHERE key='theme_color';
UPDATE t_p38294978_open_source_program_.app_settings SET label='Версия', category='system' WHERE key='version';

-- Добавляем настройки Dalan
INSERT INTO t_p38294978_open_source_program_.app_settings (key, value, category, label) VALUES
('dalan_threat_threshold', '0.75', 'dalan', 'Порог угрозы'),
('dalan_confidence_min', '0.5', 'dalan', 'Минимальная уверенность'),
('dalan_auto_block', 'false', 'dalan', 'Авто-блокировка'),
('dalan_scan_interval', '30', 'dalan', 'Интервал сканирования (сек)'),
('dalan_mode', 'monitor', 'dalan', 'Режим работы'),
('gateway_url', '', 'gateway', 'URL шлюза ПК'),
('gateway_enabled', 'false', 'gateway', 'Шлюз активен'),
('gateway_timeout', '5', 'gateway', 'Таймаут шлюза (сек)'),
('admin_password', 'admin123', 'security', 'Пароль администратора'),
('system_name', 'ECSU DALAN', 'interface', 'Имя системы'),
('primary_color', '#1a1a2e', 'interface', 'Основной цвет'),
('accent_color', '#e94560', 'interface', 'Акцентный цвет')
ON CONFLICT DO NOTHING;

-- Расширяем таблицу модулей
INSERT INTO t_p38294978_open_source_program_.app_modules (name, label, enabled) VALUES
('dalan', 'Dalan — анализ сигналов', true),
('gateway', 'Шлюз ПК', false),
('monitoring', 'Мониторинг системы', true),
('backup', 'Резервное копирование', true)
ON CONFLICT DO NOTHING;

-- Таблица точек восстановления (расширяем admin_backups)
ALTER TABLE t_p38294978_open_source_program_.admin_backups
ADD COLUMN IF NOT EXISTS dalan_config_json text DEFAULT '{}',
ADD COLUMN IF NOT EXISTS modules_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS note text;

-- Таблица конфигурации Dalan
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.dalan_config (
  id serial PRIMARY KEY,
  param_key varchar(100) NOT NULL UNIQUE,
  param_value text,
  param_label varchar(200),
  param_type varchar(50) DEFAULT 'text',
  updated_at timestamptz DEFAULT now()
);

INSERT INTO t_p38294978_open_source_program_.dalan_config (param_key, param_value, param_label, param_type) VALUES
('input_size', '10', 'Размер входного вектора', 'number'),
('hidden_size', '256', 'Размер скрытого слоя', 'number'),
('num_classes', '5', 'Количество классов', 'number'),
('learning_rate', '0.0005', 'Скорость обучения', 'number'),
('dropout_rate', '0.2', 'Dropout', 'number'),
('use_gpu', 'false', 'Использовать GPU', 'boolean'),
('model_path', 'models/dalan_nn_model.pth', 'Путь к модели', 'text'),
('batch_size', '32', 'Размер батча', 'number'),
('max_epochs', '100', 'Макс. эпох обучения', 'number')
ON CONFLICT DO NOTHING;
