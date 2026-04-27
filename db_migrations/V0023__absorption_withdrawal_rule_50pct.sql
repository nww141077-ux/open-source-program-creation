-- Правило: вывод 50% из Фонда Поглощения (id=5) на карту владельца (id=6)
INSERT INTO t_p38294978_open_source_program_.egsu_finance_rules
  (name, account_id, percent, description, is_active)
VALUES
  ('Вывод из Поглощения → Владелец', 6, 50.00, 'Ручной вывод 50% баланса Фонда Поглощения на карту Т-Банк *3293 (VLADIMIR NIKOLAEV)', true);
