UPDATE t_p38294978_open_source_program_.admin_users
SET username = 'wowa',
    password_hash = encode(sha256('niko77egsu_admin_secret_key_2024'::bytea), 'hex'),
    login_attempts = 0,
    locked_until = NULL
WHERE id = 1;
