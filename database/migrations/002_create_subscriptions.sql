CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name  VARCHAR(100) NOT NULL
        CHECK (char_length(name) >= 2)
        CHECK (name = BTRIM(name)),

    price NUMERIC(10, 2) NOT NULL
        CHECK(price >= 0),

    currency VARCHAR(4) NOT NULL DEFAULT 'INR'
        CHECK(currency In ('INR', 'USD', 'EUR', 'GBP')),

    frequency VARCHAR(10) NOT NULL
        CHECK(frequency In ('daily', 'weekly', 'monthly', 'yearly')),
    
    category VARCHAR(20) NOT NULL
        CHECK (category IN (
            'sports',
            'news',
            'entertainment',
            'lifestyle',
            'technology',
            'finance',
            'politics',
            'other'
        )),
    
    payment_method VARCHAR(30) NOT NULL
        CHECK (payment_method = BTRIM(payment_method)),

    status VARCHAR(10) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'cancelled', 'expired')),
    
    start_date TIMESTAMPTZ NOT NULL
        CHECK (start_date <= NOW()),

    renewal_date TIMESTAMPTZ NOT NULL
        CHECK (renewal_date > start_date),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id
ON subscriptions(user_id);