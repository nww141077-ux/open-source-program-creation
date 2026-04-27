-- Стратегические инициативы развития человечества
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_strategy_items (
  id SERIAL PRIMARY KEY,
  section VARCHAR(50) NOT NULL DEFAULT 'humanity',
  title VARCHAR(500) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(30) DEFAULT 'draft',
  tags TEXT,
  author VARCHAR(255) DEFAULT 'Николаев Владимир Владимирович',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Распоряжения по стратегическим инициативам
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_strategy_orders (
  id SERIAL PRIMARY KEY,
  strategy_item_id INT,
  title VARCHAR(500) NOT NULL,
  order_text TEXT NOT NULL,
  target_organ VARCHAR(100) NOT NULL,
  target_external VARCHAR(255),
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(30) DEFAULT 'pending',
  author VARCHAR(255) DEFAULT 'Николаев Владимир Владимирович',
  organ_response TEXT,
  forwarded_to TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Журнал отправки в интернет-приёмные
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_reception_log (
  id SERIAL PRIMARY KEY,
  organ_code VARCHAR(50),
  external_contact_id INT,
  agency_name VARCHAR(255),
  subject VARCHAR(500),
  message_text TEXT NOT NULL,
  sender_name VARCHAR(255) DEFAULT 'Николаев Владимир Владимирович',
  method VARCHAR(30) DEFAULT 'online_form',
  url_used VARCHAR(500),
  status VARCHAR(30) DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_items_section ON t_p38294978_open_source_program_.egsu_strategy_items(section);
CREATE INDEX IF NOT EXISTS idx_strategy_orders_item ON t_p38294978_open_source_program_.egsu_strategy_orders(strategy_item_id);
CREATE INDEX IF NOT EXISTS idx_reception_log_organ ON t_p38294978_open_source_program_.egsu_reception_log(organ_code);

-- Начальные стратегические инициативы
INSERT INTO t_p38294978_open_source_program_.egsu_strategy_items
  (section, title, description, priority, status, tags, sort_order)
VALUES
  ('humanity', 'Глобальный мониторинг климатических угроз', 'Создание единой платформы мониторинга климатических изменений с подключением спутниковых данных, дронов и IoT-датчиков. Цель: раннее предупреждение катастроф.', 'critical', 'active', 'климат,экология,мониторинг', 1),
  ('humanity', 'Система предотвращения ядерных конфликтов', 'Разработка протоколов взаимодействия между ядерными державами через платформу EGSU. Создание зон автоматического оповещения при угрозе эскалации.', 'critical', 'active', 'безопасность,ядерное,дипломатия', 2),
  ('humanity', 'Цифровое равенство и доступ к образованию', 'Обеспечение 100% доступа к цифровому образованию для населения планеты. Подключение удалённых регионов через спутниковый интернет и образовательные платформы.', 'high', 'active', 'образование,цифровизация,равенство', 3),
  ('humanity', 'Реформа международной финансовой системы', 'Создание прозрачной многополярной финансовой архитектуры. Интеграция CBDC, снижение зависимости от доллара, справедливое распределение ресурсов.', 'high', 'draft', 'финансы,реформа,валюта', 4),
  ('humanity', 'Единая система управления пандемиями', 'Создание глобального протокола реагирования на пандемии. Банки данных патогенов, автоматическое распределение вакцин, ликвидация бюрократических барьеров.', 'high', 'active', 'здравоохранение,пандемия,вакцины', 5),
  ('humanity', 'Защита суверенитета и прав народов', 'Механизм защиты малых народов и государств от поглощения корпоративными и политическими интересами. Цифровая хартия прав народов.', 'normal', 'draft', 'права,суверенитет,народы', 6);
