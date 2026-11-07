CREATE TABLE accounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(10) NOT NULL CHECK (type IN ('Bank', 'Wallet')),
    detail      VARCHAR(255) NOT NULL DEFAULT '',
    balance     BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    icon        VARCHAR(50) NOT NULL DEFAULT 'Wallet',
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
