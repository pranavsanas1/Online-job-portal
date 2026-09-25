-- NokariSetu relational model for PostgreSQL.
-- Spring Boot can run this during local development when SQL initialization is enabled.

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(24) NOT NULL CHECK (role IN ('seeker', 'recruiter', 'admin')),
    status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'removed')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    company VARCHAR(180) NOT NULL,
    location VARCHAR(180) NOT NULL,
    work_type VARCHAR(40) NOT NULL,
    salary VARCHAR(80) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id),
    seeker_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    match_score INTEGER NOT NULL DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id BIGINT PRIMARY KEY REFERENCES users(id),
    role_updates BOOLEAN NOT NULL DEFAULT TRUE,
    weekly_digest BOOLEAN NOT NULL DEFAULT FALSE,
    product_notes BOOLEAN NOT NULL DEFAULT TRUE,
    language VARCHAR(32) NOT NULL DEFAULT 'English'
);