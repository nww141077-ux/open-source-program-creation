-- Обновляем пароль владельца: sha256('nexaflow2026141077')
UPDATE t_p38294978_open_source_program_.users
SET password_hash = encode(sha256(convert_to('nexaflow2026141077', 'UTF8')), 'hex')
WHERE email = 'nikolaevvladimir77@yandex.ru';
