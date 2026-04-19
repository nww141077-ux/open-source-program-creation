-- ИИ предложения по улучшению системы (отдельная таблица)
CREATE TABLE IF NOT EXISTS "t_p38294978_open_source_program_"."ai_improvement_proposals" (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL DEFAULT 'ai_system',
    category VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    logic_reasoning TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(30) DEFAULT 'pending',
    owner_decision VARCHAR(20) DEFAULT NULL,
    owner_comment TEXT DEFAULT NULL,
    tokens_required NUMERIC(20,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP DEFAULT NULL,
    applied_at TIMESTAMP DEFAULT NULL
);

-- Фонд развития ИИ (10% от токенов)
CREATE TABLE IF NOT EXISTS "t_p38294978_open_source_program_"."ai_development_fund" (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    amount NUMERIC(20,4) NOT NULL,
    source_description TEXT,
    fund_balance NUMERIC(20,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Запросы одобрения изменений от ИИ
CREATE TABLE IF NOT EXISTS "t_p38294978_open_source_program_"."ai_approval_requests" (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER REFERENCES "t_p38294978_open_source_program_"."ai_improvement_proposals"(id),
    request_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    notification_sent_email BOOLEAN DEFAULT FALSE,
    notification_sent_app BOOLEAN DEFAULT FALSE,
    owner_email VARCHAR(255) DEFAULT 'nikolaevvladimir77@yandex.ru',
    status VARCHAR(20) DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP DEFAULT NULL
);

-- Лог синхронизации ИИ с редактором
CREATE TABLE IF NOT EXISTS "t_p38294978_open_source_program_"."ai_sync_log" (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL,
    ai_source VARCHAR(100) NOT NULL,
    data_analyzed TEXT,
    insights_generated INTEGER DEFAULT 0,
    proposals_created INTEGER DEFAULT 0,
    tokens_collected NUMERIC(20,4) DEFAULT 0,
    fund_contribution NUMERIC(20,4) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Начальный баланс фонда
INSERT INTO "t_p38294978_open_source_program_"."ai_development_fund" 
    (operation_type, amount, source_description, fund_balance)
VALUES 
    ('init', 0, 'Инициализация фонда развития ИИ', 0);
