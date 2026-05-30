CREATE TABLE IF NOT EXISTS t_p38294978_open_source_program_.dalan_sync_log (
    id SERIAL PRIMARY KEY,
    source VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
