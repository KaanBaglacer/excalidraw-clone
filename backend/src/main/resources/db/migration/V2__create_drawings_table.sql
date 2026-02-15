CREATE TABLE drawings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    elements        JSONB NOT NULL DEFAULT '[]'::jsonb,
    app_state       JSONB NOT NULL DEFAULT '{}'::jsonb,
    thumbnail_url   VARCHAR(500),
    is_public       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drawings_owner_id ON drawings(owner_id);
CREATE INDEX idx_drawings_is_public ON drawings(is_public) WHERE is_public = true;
CREATE INDEX idx_drawings_updated_at ON drawings(updated_at DESC);
