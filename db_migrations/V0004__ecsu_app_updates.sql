CREATE TABLE IF NOT EXISTS ecsu_app_updates (
    id          SERIAL PRIMARY KEY,
    version     TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    update_type TEXT DEFAULT 'patch',
    payload     JSONB DEFAULT '{}',
    files       JSONB DEFAULT '[]',
    created_by  TEXT DEFAULT 'admin',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    applied_at  TIMESTAMPTZ,
    status      TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS ecsu_update_log (
    id          SERIAL PRIMARY KEY,
    update_id   INT REFERENCES ecsu_app_updates(id),
    agent_id    TEXT NOT NULL,
    hostname    TEXT,
    applied_at  TIMESTAMPTZ DEFAULT NOW(),
    result      TEXT DEFAULT 'ok',
    details     TEXT
);
