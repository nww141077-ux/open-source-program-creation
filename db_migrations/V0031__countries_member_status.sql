-- Страны — это справочник внешних контактов (куда направлять обращения), а не "участники системы".
-- Помечаем их как "справочные контакты" а не "вступившие участники"
-- Добавляем поле member_status чтобы отличать: reference (справочник) vs joined (вступили)
ALTER TABLE egsu_countries ADD COLUMN IF NOT EXISTS member_status VARCHAR(30) DEFAULT 'reference';
-- Все существующие — это справочные ведомства, не члены системы
UPDATE egsu_countries SET member_status = 'reference';
