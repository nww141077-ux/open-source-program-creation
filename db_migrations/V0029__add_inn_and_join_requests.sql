-- Добавляем ИНН и статус разработки в конфиг фонда
ALTER TABLE egsu_fund_config ADD COLUMN IF NOT EXISTS inn VARCHAR(12);
ALTER TABLE egsu_fund_config ADD COLUMN IF NOT EXISTS system_status VARCHAR(50) DEFAULT 'development';

-- Таблица заявок на вступление в ECSU (органы или участники)
CREATE TABLE IF NOT EXISTS egsu_join_requests (
  id SERIAL PRIMARY KEY,
  request_type VARCHAR(50) NOT NULL DEFAULT 'member', -- 'organ_member' | 'country' | 'observer'
  organ_code VARCHAR(50),          -- для member: в какой орган
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  country VARCHAR(100),
  organization VARCHAR(255),
  position VARCHAR(255),
  motivation TEXT,
  experience TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  owner_note TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрой выборки
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON egsu_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_created ON egsu_join_requests(created_at DESC);
