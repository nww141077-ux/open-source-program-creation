-- Помечаем тестовые инциденты как архивные (вместо удаления)
UPDATE egsu_incidents SET status = 'archived' WHERE title LIKE '%тест%' OR title LIKE '%test%' OR description LIKE '%тестовый%';

-- Обновляем статус системы как "в разработке"  
UPDATE egsu_fund_config SET system_status = 'development' WHERE id = 1;
