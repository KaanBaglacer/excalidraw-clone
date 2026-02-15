CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    username        VARCHAR(100) NOT NULL,
    password_hash   VARCHAR(255),
    avatar_url      VARCHAR(500),
    provider        VARCHAR(20) NOT NULL DEFAULT 'local',
    provider_id     VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_provider_id UNIQUE (provider, provider_id)
);

CREATE INDEX idx_users_email ON users(email);
