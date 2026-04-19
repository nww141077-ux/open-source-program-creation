
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.my_model_config (
  id SERIAL PRIMARY KEY,
  base_model_id VARCHAR(100) NOT NULL DEFAULT 'llama3',
  model_name VARCHAR(200) NOT NULL DEFAULT 'Моя модель',
  owner_name VARCHAR(200) NOT NULL DEFAULT 'Владимир',
  system_prompt TEXT DEFAULT '',
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1024,
  language VARCHAR(20) DEFAULT 'ru',
  domain VARCHAR(100) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p38294978_open_source_program_.my_model_config
  (base_model_id, model_name, owner_name, system_prompt, domain)
VALUES
  ('mistral-7b', 'ECSU Assistant v1', 'Владимир', 'Ты персональный ИИ-ассистент системы ECSU 2.0. Отвечай точно, по делу, на русском языке.', 'legal')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.model_training_data (
  id SERIAL PRIMARY KEY,
  data_type VARCHAR(50) NOT NULL DEFAULT 'instruction',
  instruction TEXT NOT NULL,
  response TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  quality_score INTEGER DEFAULT 5 CHECK (quality_score BETWEEN 1 AND 10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.model_training_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(200) NOT NULL,
  details TEXT,
  base_model VARCHAR(100),
  model_name VARCHAR(200),
  owner_name VARCHAR(200),
  document_hash VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.model_documents (
  id SERIAL PRIMARY KEY,
  doc_type VARCHAR(100) NOT NULL,
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  base_model VARCHAR(100),
  model_name VARCHAR(200),
  owner_name VARCHAR(200),
  doc_hash VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
