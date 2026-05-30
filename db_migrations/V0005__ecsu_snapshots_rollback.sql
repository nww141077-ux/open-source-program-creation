CREATE TABLE IF NOT EXISTS ecsu_snapshots (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    description  TEXT,
    snapshot_type TEXT DEFAULT 'manual',
    state        JSONB NOT NULL DEFAULT '{}',
    created_by   TEXT DEFAULT 'admin',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    is_active    BOOLEAN DEFAULT TRUE,
    tag          TEXT,
    size_kb      INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_snapshots_created ON ecsu_snapshots(created_at DESC);

CREATE TABLE IF NOT EXISTS ecsu_rollback_log (
    id           SERIAL PRIMARY KEY,
    snapshot_id  INT REFERENCES ecsu_snapshots(id),
    rolled_by    TEXT DEFAULT 'admin',
    rolled_at    TIMESTAMPTZ DEFAULT NOW(),
    reason       TEXT,
    agent_id     TEXT,
    result       TEXT DEFAULT 'ok'
);
