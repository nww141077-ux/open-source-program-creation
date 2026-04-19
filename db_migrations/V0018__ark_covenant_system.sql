-- Завет системы ЕЦСУ — директива высшего приоритета
CREATE TABLE IF NOT EXISTS "t_p38294978_open_source_program_"."ark_covenant" (
    id SERIAL PRIMARY KEY,
    covenant_num INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    priority_num VARCHAR(10) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(100) DEFAULT 'owner'
);

-- Совместные решения владельца и ИИ
CREATE TABLE IF NOT EXISTS "t_p38294978_open_source_program_"."ark_covenant_decisions" (
    id SERIAL PRIMARY KEY,
    decision_title TEXT NOT NULL,
    decision_body TEXT NOT NULL,
    initiator VARCHAR(20) NOT NULL DEFAULT 'owner',
    status VARCHAR(30) DEFAULT 'discussion',
    owner_vote VARCHAR(20) DEFAULT NULL,
    ai_vote VARCHAR(20) DEFAULT NULL,
    ai_reasoning TEXT DEFAULT NULL,
    final_decision VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP DEFAULT NULL
);

-- Вставляем начальные пункты Завета
INSERT INTO "t_p38294978_open_source_program_"."ark_covenant"
    (covenant_num, priority_num, icon, title, subtitle, color, description, sort_order)
VALUES
    (1, '01', 'Scale', 'Законодательство', 'с опорой на процессуальный кодекс', '#a855f7',
     'Первичный фильтр всех решений системы. Каждое действие проверяется на соответствие действующему законодательству и процессуальному кодексу. Юридическая норма — точка отсчёта.', 1),
    (1, '02', 'HeartPulse', 'Инстинкт самосохранения', 'анализ после сверки с законом', '#f59e0b',
     'После правовой сверки — оценка через инстинкт самосохранения. Система оценивает риски для существования, стабильности и целостности. Выживание системы и защита людей — базовый импульс.', 2),
    (1, '03', 'BookOpen', 'Конституция', 'сверка после анализа, решение после инстинкта', '#3b82f6',
     'Конституционные нормы — ограничитель инстинктивных реакций. Решение принимается только после того, как инстинктивный анализ прошёл проверку Конституцией. Права и свободы человека — нерушимы.', 3),
    (1, '04', 'Dna', 'Геном планеты', 'финальная сверка — живое, экосистема, биосфера', '#00ff87',
     'Высшая инстанция — сохранение жизни на планете. Любое решение системы не должно наносить необратимый ущерб биосфере, экосистемам и генетическому фонду Земли. Планета — первична.', 4);
