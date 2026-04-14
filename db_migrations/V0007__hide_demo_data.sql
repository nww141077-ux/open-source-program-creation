-- Помечаем демо счета как неактивные (скрываем из интерфейса)
UPDATE t_p38294978_open_source_program_.egsu_finance_accounts
SET is_active = false,
    label = CONCAT('[DEMO] ', label)
WHERE id IN (1, 2, 3, 4);

-- Помечаем демо транзакции как скрытые через статус
UPDATE t_p38294978_open_source_program_.egsu_finance_transactions
SET status = 'demo_hidden'
WHERE account_id IN (1, 2, 3, 4)
   OR (source IN ('External', 'System', 'Transfer', 'Payroll', 'UNEP')
       AND created_at < NOW() - INTERVAL '1 day');

-- Помечаем демо события безопасности как тестовые
UPDATE t_p38294978_open_source_program_.egsu_security_events
SET description = CONCAT('[DEMO] ', description)
WHERE id IN (1, 2, 3, 4, 5)
  AND created_at < NOW() - INTERVAL '1 day';

-- Удаляем демо API ключ
UPDATE t_p38294978_open_source_program_.egsu_api_integrations
SET is_active = false,
    platform_name = '[DEMO] ' || platform_name
WHERE api_key = 'egsu-demo-key-2026';
