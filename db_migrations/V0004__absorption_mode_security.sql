INSERT INTO t_p38294978_open_source_program_.egsu_finance_accounts (owner_name, account_type, account_number, bank_name, currency, label, is_primary, distribution_percent, balance) VALUES ('ABSORPTION MODE FUND', 'system', 'EGSU-ABS-9999', 'EGSU Security', 'USD', 'Absorption Mode - Penalty Fund', false, 0, 0.00);

CREATE TABLE t_p38294978_open_source_program_.egsu_security_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  ip_address VARCHAR(64),
  user_agent TEXT,
  endpoint VARCHAR(255),
  description TEXT,
  penalty_amount NUMERIC(12,2) DEFAULT 0,
  absorption_account_id INTEGER,
  is_blocked BOOLEAN DEFAULT false,
  geo_country VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p38294978_open_source_program_.egsu_blocked_ips (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(64) UNIQUE NOT NULL,
  reason TEXT,
  blocked_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_permanent BOOLEAN DEFAULT false
);

INSERT INTO t_p38294978_open_source_program_.egsu_security_events (event_type, severity, ip_address, description, penalty_amount, is_blocked) VALUES ('unauthorized_access', 'high', '185.220.101.47', 'Попытка несанкционированного входа в систему', 500, true);
INSERT INTO t_p38294978_open_source_program_.egsu_security_events (event_type, severity, ip_address, description, penalty_amount, is_blocked) VALUES ('cyber_attack', 'critical', '94.102.49.190', 'DDoS-атака на API endpoint /egsu/dashboard', 2500, true);
INSERT INTO t_p38294978_open_source_program_.egsu_security_events (event_type, severity, ip_address, description, penalty_amount, is_blocked) VALUES ('data_scraping', 'medium', '46.161.27.151', 'Попытка массового копирования данных', 250, true);
INSERT INTO t_p38294978_open_source_program_.egsu_security_events (event_type, severity, ip_address, description, penalty_amount, is_blocked) VALUES ('brute_force', 'high', '91.108.4.0', 'Подбор учётных данных — 847 попыток', 750, true);
INSERT INTO t_p38294978_open_source_program_.egsu_security_events (event_type, severity, ip_address, description, penalty_amount, is_blocked) VALUES ('unauthorized_access', 'medium', '179.43.128.0', 'Попытка доступа к закрытому разделу', 150, false);

UPDATE t_p38294978_open_source_program_.egsu_finance_accounts SET balance = 4150.00 WHERE account_number = 'EGSU-ABS-9999';
