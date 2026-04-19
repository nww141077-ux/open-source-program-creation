
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p38294978_open_source_program_.admin_users (username, password_hash)
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uTNK')
ON CONFLICT (username) DO NOTHING;

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.app_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p38294978_open_source_program_.app_settings (key, value) VALUES
  ('app_name', 'Моё приложение'),
  ('logo_path', ''),
  ('theme_color', '#3498db'),
  ('version', '1.0.0')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.app_modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(200) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p38294978_open_source_program_.app_modules (name, label, enabled) VALUES
  ('chat', 'Чат', true),
  ('payments', 'Платежи', false),
  ('notifications', 'Уведомления', true),
  ('analytics', 'Аналитика', true),
  ('api', 'API доступ', false)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.admin_files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  file_size INTEGER DEFAULT 0,
  content_type VARCHAR(200),
  s3_key VARCHAR(1000),
  cdn_url VARCHAR(1000),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.admin_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(500) NOT NULL,
  details TEXT,
  username VARCHAR(100) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.admin_backups (
  id SERIAL PRIMARY KEY,
  label VARCHAR(200),
  settings_json TEXT NOT NULL,
  modules_json TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
