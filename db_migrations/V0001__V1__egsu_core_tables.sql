
CREATE TABLE IF NOT EXISTS egsu_incidents (
  id SERIAL PRIMARY KEY,
  incident_code VARCHAR(20) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  country VARCHAR(100) NOT NULL,
  location TEXT,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status VARCHAR(30) NOT NULL DEFAULT 'pending_verification',
  verification_score INTEGER DEFAULT 0,
  has_photo BOOLEAN DEFAULT FALSE,
  has_video BOOLEAN DEFAULT FALSE,
  has_witnesses BOOLEAN DEFAULT FALSE,
  has_satellite BOOLEAN DEFAULT FALSE,
  has_official_source BOOLEAN DEFAULT FALSE,
  mgp_distinction BOOLEAN DEFAULT FALSE,
  mgp_proportionality BOOLEAN DEFAULT FALSE,
  mgp_necessity BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  responsible_organ VARCHAR(100),
  contact_email VARCHAR(255),
  is_anonymous BOOLEAN DEFAULT FALSE,
  ai_confidence INTEGER DEFAULT 0,
  step1_at TIMESTAMP,
  step2_deadline TIMESTAMP,
  step2_at TIMESTAMP,
  step3_deadline TIMESTAMP,
  step3_at TIMESTAMP,
  step4_at TIMESTAMP,
  step5_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egsu_incident_actions (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER REFERENCES egsu_incidents(id),
  action_code VARCHAR(100) NOT NULL,
  action_label VARCHAR(500) NOT NULL,
  legal_basis TEXT,
  applied_at TIMESTAMP DEFAULT NOW(),
  applied_by VARCHAR(100) DEFAULT 'ЕГСУ-Система'
);

CREATE TABLE IF NOT EXISTS egsu_investigations (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER REFERENCES egsu_incidents(id),
  ogr_group VARCHAR(100),
  findings TEXT,
  mgp_assessment TEXT,
  conclusion VARCHAR(20),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egsu_market_tokens (
  id SERIAL PRIMARY KEY,
  holder VARCHAR(255) NOT NULL,
  balance NUMERIC(20,4) DEFAULT 0,
  total_earned NUMERIC(20,4) DEFAULT 0,
  total_spent NUMERIC(20,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egsu_market_transactions (
  id SERIAL PRIMARY KEY,
  from_holder VARCHAR(255),
  to_holder VARCHAR(255),
  amount NUMERIC(20,4) NOT NULL,
  commission NUMERIC(20,4) DEFAULT 0,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
