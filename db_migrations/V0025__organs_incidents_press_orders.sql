-- Таблица распоряжений владельца по инцидентам
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_owner_orders (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER REFERENCES t_p38294978_open_source_program_.egsu_incidents(id),
  incident_code VARCHAR(20),
  order_text TEXT NOT NULL,
  target_organ VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(30) DEFAULT 'issued',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица пресс-релизов (публикации в открытые каналы)
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_press_releases (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER REFERENCES t_p38294978_open_source_program_.egsu_incidents(id),
  incident_code VARCHAR(20),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  channel VARCHAR(100) NOT NULL DEFAULT 'public',
  status VARCHAR(30) DEFAULT 'draft',
  published_at TIMESTAMP,
  published_by VARCHAR(100) DEFAULT 'EGSU-Система',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица: уведомления органам от инцидентов
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_organ_notifications (
  id SERIAL PRIMARY KEY,
  organ_code VARCHAR(50) NOT NULL,
  incident_id INTEGER REFERENCES t_p38294978_open_source_program_.egsu_incidents(id),
  incident_code VARCHAR(20),
  notification_type VARCHAR(50) NOT NULL DEFAULT 'incident',
  title VARCHAR(500) NOT NULL,
  body TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organ_notifications_organ ON t_p38294978_open_source_program_.egsu_organ_notifications(organ_code);
CREATE INDEX IF NOT EXISTS idx_organ_notifications_incident ON t_p38294978_open_source_program_.egsu_organ_notifications(incident_id);
CREATE INDEX IF NOT EXISTS idx_press_releases_incident ON t_p38294978_open_source_program_.egsu_press_releases(incident_id);
CREATE INDEX IF NOT EXISTS idx_owner_orders_incident ON t_p38294978_open_source_program_.egsu_owner_orders(incident_id);
