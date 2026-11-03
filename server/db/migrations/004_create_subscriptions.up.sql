CREATE TABLE subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan        VARCHAR(50) NOT NULL DEFAULT 'monthly',
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    start_date  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date    TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
