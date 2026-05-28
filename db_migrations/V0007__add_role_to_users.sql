ALTER TABLE t_p38294978_open_source_program_.users 
ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'user';

UPDATE t_p38294978_open_source_program_.users 
SET role = 'owner' 
WHERE email = 'owner@nexaflow.local';
