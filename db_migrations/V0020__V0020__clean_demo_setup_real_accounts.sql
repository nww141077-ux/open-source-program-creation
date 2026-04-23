-- V0020: Чистка демо-данных, реальные счета, блокнот, гражданские иски

UPDATE t_p38294978_open_source_program_.egsu_finance_transactions SET status = 'archived' WHERE status = 'demo_hidden';

UPDATE t_p38294978_open_source_program_.egsu_notifications SET is_read = true WHERE id IN (1,2,3,4,5);

UPDATE t_p38294978_open_source_program_.egsu_finance_accounts SET is_active = false, balance = 0.00, updated_at = now() WHERE id IN (1,2,3,4);

UPDATE t_p38294978_open_source_program_.egsu_finance_accounts SET balance = 0.00, label = 'Фонд Поглощения — Штрафные средства', updated_at = now() WHERE id = 5;

ALTER TABLE t_p38294978_open_source_program_.egsu_finance_accounts 
  ADD COLUMN IF NOT EXISTS card_number character varying(20) NULL,
  ADD COLUMN IF NOT EXISTS card_holder character varying(255) NULL,
  ADD COLUMN IF NOT EXISTS card_expiry character varying(10) NULL,
  ADD COLUMN IF NOT EXISTS bik character varying(20) NULL,
  ADD COLUMN IF NOT EXISTS correspondent_account character varying(30) NULL,
  ADD COLUMN IF NOT EXISTS inn character varying(20) NULL,
  ADD COLUMN IF NOT EXISTS bank_address text NULL,
  ADD COLUMN IF NOT EXISTS swift character varying(20) NULL,
  ADD COLUMN IF NOT EXISTS iban character varying(40) NULL,
  ADD COLUMN IF NOT EXISTS description text NULL,
  ADD COLUMN IF NOT EXISTS purpose character varying(100) NULL;

INSERT INTO t_p38294978_open_source_program_.egsu_finance_accounts (owner_name, account_type, account_number, bank_name, currency, label, is_active, is_primary, distribution_percent, balance, purpose, description)
VALUES 
  ('ECSU 2.0 Владелец', 'personal', NULL, NULL, 'RUB', 'Основной счёт (карта или расчётный)', true, true, 70.00, 0.00, 'donations', 'Основной счёт для донатов и поступлений. Заполните реквизиты карты или банковского счёта.'),
  ('ECSU 2.0 Резерв', 'system', 'ECSU-RSV-001', 'ECSU Internal', 'RUB', 'Резервный фонд (авто 20%)', true, false, 20.00, 0.00, 'reserve', '20% от всех поступлений автоматически'),
  ('ECSU 2.0 Развитие', 'system', 'ECSU-DEV-001', 'ECSU Internal', 'RUB', 'Фонд развития Далан-1 (авто 10%)', true, false, 10.00, 0.00, 'development', '10% на развитие ИИ Далан-1');

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_civil_claims (
  id SERIAL PRIMARY KEY,
  claimant_name character varying(255) NOT NULL,
  claimant_email character varying(255) NULL,
  claimant_phone character varying(50) NULL,
  violation_type character varying(100) NOT NULL,
  violation_description text NOT NULL,
  legal_basis text NULL,
  claimed_amount numeric(15,2) NULL DEFAULT 0,
  evidence_description text NULL,
  incident_id integer NULL,
  status character varying(50) NOT NULL DEFAULT 'new',
  penalty_charged numeric(15,2) NULL DEFAULT 0,
  absorption_account_id integer NULL,
  resolution_notes text NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

ALTER TABLE t_p38294978_open_source_program_.egsu_security_events 
  ADD COLUMN IF NOT EXISTS civil_claim_id integer NULL,
  ADD COLUMN IF NOT EXISTS penalty_paid boolean NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS penalty_paid_at timestamp NULL;

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_scheduler_log (
  id SERIAL PRIMARY KEY,
  task_name character varying(100) NOT NULL,
  status character varying(20) DEFAULT 'pending',
  result_summary text NULL,
  incidents_found integer DEFAULT 0,
  started_at timestamp DEFAULT now(),
  finished_at timestamp NULL
);

CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_graphium_notes (
  id SERIAL PRIMARY KEY,
  title character varying(500) NULL,
  content text NOT NULL DEFAULT '',
  note_type character varying(50) DEFAULT 'note',
  tags text[] DEFAULT '{}',
  color character varying(20) DEFAULT 'default',
  is_pinned boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
