CREATE TABLE t_p38294978_open_source_program_.egsu_withdrawal_requests (
  id SERIAL PRIMARY KEY,
  from_account_id INTEGER REFERENCES t_p38294978_open_source_program_.egsu_finance_accounts(id),
  to_account_id INTEGER REFERENCES t_p38294978_open_source_program_.egsu_finance_accounts(id),
  to_account_details JSONB,
  amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  description TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  confirmed_at TIMESTAMP,
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
