CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(50) NOT NULL
        CHECK (char_length(name) >= 2)
        CHECK (name = BTRIM(name)),

    email VARCHAR(255) NOT NULL UNIQUE
        CHECK (email = LOWER(email))
        CHECK (email = BTRIM(email))
        CHECK (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),

    password TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
