CREATE TABLE IF NOT EXISTS ecsu_service_orders (
  id SERIAL PRIMARY KEY,
  service_code VARCHAR(50) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  message TEXT,
  amount_rub NUMERIC(12,2),
  status VARCHAR(30) NOT NULL DEFAULT 'new',
  owner_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ecsu_orders_status ON ecsu_service_orders(status);
CREATE INDEX IF NOT EXISTS idx_ecsu_orders_created ON ecsu_service_orders(created_at DESC);
