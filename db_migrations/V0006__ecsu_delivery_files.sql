CREATE TABLE IF NOT EXISTS ecsu_delivery_files (
    id           SERIAL PRIMARY KEY,
    filename     TEXT NOT NULL,
    description  TEXT,
    file_type    TEXT DEFAULT 'document',
    content_b64  TEXT,
    dest_path    TEXT DEFAULT '',
    size_bytes   INT DEFAULT 0,
    created_by   TEXT DEFAULT 'admin',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    status       TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS ecsu_delivery_log (
    id           SERIAL PRIMARY KEY,
    file_id      INT REFERENCES ecsu_delivery_files(id),
    agent_id     TEXT NOT NULL,
    hostname     TEXT,
    received_at  TIMESTAMPTZ DEFAULT NOW(),
    result       TEXT DEFAULT 'ok'
);
