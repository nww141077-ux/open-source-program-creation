ALTER TABLE t_p38294978_open_source_program_.egsu_incidents
  ADD COLUMN IF NOT EXISTS source_id VARCHAR(200) UNIQUE,
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS auto_scanned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scan_source VARCHAR(100);

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_ai_actions (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(100) NOT NULL,
  target_table VARCHAR(100),
  target_id INTEGER,
  payload JSONB,
  result JSONB,
  performed_by VARCHAR(100) DEFAULT 'egsu-ai',
  performed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_system_log (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  source VARCHAR(100),
  message TEXT,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
