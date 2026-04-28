-- Фонд ДАЛАН — Развитие ECSU
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_fund_config (
  id SERIAL PRIMARY KEY,
  fund_name VARCHAR(255) DEFAULT 'Фонд ДАЛАН — Развитие ECSU',
  fund_status VARCHAR(50) DEFAULT 'experimental',
  founder VARCHAR(255) DEFAULT 'Николаев Владимир Владимирович',
  jurisdiction VARCHAR(100) DEFAULT 'РФ, Алтайский край',
  tax_mode VARCHAR(20) DEFAULT 'ndfl',
  tax_rate_percent NUMERIC(5,2) DEFAULT 13.00,
  owner_share_percent NUMERIC(5,2) DEFAULT 51.00,
  dev_share_percent NUMERIC(5,2) DEFAULT 49.00,
  owner_card_last4 VARCHAR(4) DEFAULT NULL,
  owner_bank VARCHAR(100) DEFAULT NULL,
  description TEXT DEFAULT 'Экспериментальный проект в стадии разработки. Все операции требуют ручного подтверждения владельца.',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Поступления в фонд
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_fund_income (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(50) NOT NULL,
  source_name VARCHAR(255) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'RUB',
  description TEXT,
  status VARCHAR(30) DEFAULT 'received',
  received_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Распределение после налогов (по каждому поступлению)
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_fund_distributions (
  id SERIAL PRIMARY KEY,
  income_id INT REFERENCES t_p38294978_open_source_program_.egsu_fund_income(id),
  gross_amount NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) NOT NULL,
  net_amount NUMERIC(15,2) NOT NULL,
  owner_amount NUMERIC(15,2) NOT NULL,
  dev_amount NUMERIC(15,2) NOT NULL,
  tax_mode VARCHAR(20) DEFAULT 'ndfl',
  tax_rate NUMERIC(5,2) DEFAULT 13.00,
  status VARCHAR(30) DEFAULT 'calculated',
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- Заявки на вывод (личный вывод владельца)
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_fund_withdrawals (
  id SERIAL PRIMARY KEY,
  withdrawal_type VARCHAR(30) DEFAULT 'owner',
  amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'RUB',
  destination VARCHAR(255),
  description TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP DEFAULT NULL,
  notes TEXT
);

-- Расходы на разработку
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_fund_expenses (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'RUB',
  description TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  approved_by VARCHAR(255) DEFAULT 'Николаев Владимир Владимирович',
  approved_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Начальная конфигурация фонда
INSERT INTO t_p38294978_open_source_program_.egsu_fund_config
  (fund_name, fund_status, founder, jurisdiction, tax_mode, tax_rate_percent, owner_share_percent, dev_share_percent, description)
VALUES
  ('Фонд ДАЛАН — Развитие ECSU', 'experimental', 'Николаев Владимир Владимирович',
   'РФ, Алтайский край', 'ndfl', 13.00, 51.00, 49.00,
   'Экспериментальный проект в стадии разработки. Все финансовые операции требуют ручного подтверждения владельца. Реальные выплаты осуществляются вне системы через официальные банковские каналы.');

-- Категории расходов (справочник)
CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.egsu_fund_expense_categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20)
);

INSERT INTO t_p38294978_open_source_program_.egsu_fund_expense_categories (code, name, icon, color) VALUES
  ('ai_api', 'Оплата ИИ-API (OpenAI, Gemini, Claude)', 'Brain', '#a855f7'),
  ('datasets', 'Датасеты и обучающие данные', 'Database', '#3b82f6'),
  ('compute', 'Вычислительные мощности', 'Server', '#06b6d4'),
  ('research', 'Научные исследования', 'FlaskConical', '#10b981'),
  ('development', 'Разработка платформы', 'Code2', '#f59e0b'),
  ('legal', 'Юридическое сопровождение', 'Scale', '#ec4899'),
  ('other', 'Прочие расходы', 'MoreHorizontal', '#6b7280');

CREATE INDEX IF NOT EXISTS idx_fund_income_status ON t_p38294978_open_source_program_.egsu_fund_income(status);
CREATE INDEX IF NOT EXISTS idx_fund_withdrawals_status ON t_p38294978_open_source_program_.egsu_fund_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_fund_expenses_status ON t_p38294978_open_source_program_.egsu_fund_expenses(status);
