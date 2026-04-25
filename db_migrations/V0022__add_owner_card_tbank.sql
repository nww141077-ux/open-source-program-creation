-- Обновляем основной счёт владельца с реквизитами Т-Банк
UPDATE t_p38294978_open_source_program_.egsu_finance_accounts
SET
  owner_name     = 'Николаев Владимир Владимирович',
  account_type   = 'card',
  bank_name      = 'Т-Банк (Тинькофф)',
  card_number    = '2200702053013293',
  card_holder    = 'VLADIMIR NIKOLAEV',
  card_expiry    = '10/35',
  inn            = '228800855569',
  label          = 'Т-Банк · VLADIMIR NIKOLAEV · *3293',
  is_primary     = true,
  is_active      = true,
  currency       = 'RUB',
  purpose        = 'income_withdrawal',
  description    = 'Основная карта для поступлений и вывода средств из режима Поглощения. СНИЛС: 190-653-742-84, ИНН: 228800855569'
WHERE id = 6;

-- Добавляем карту в egsu_finance_cards привязанную к счёту 6
INSERT INTO t_p38294978_open_source_program_.egsu_finance_cards
  (account_id, card_holder, card_last4, card_type, expiry_month, expiry_year)
VALUES
  (6, 'VLADIMIR NIKOLAEV', '3293', 'mir', 10, 2035);
