CREATE TABLE transfers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind            VARCHAR(20) NOT NULL CHECK (kind IN ('transfer', 'withdrawal')),
    from_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    to_account_id   UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    amount          BIGINT NOT NULL CHECK (amount > 0),
    fee             BIGINT NOT NULL DEFAULT 0 CHECK (fee >= 0),
    note            VARCHAR(255) NOT NULL DEFAULT '',
    occurred_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT transfers_different_accounts CHECK (from_account_id <> to_account_id)
);

CREATE INDEX idx_transfers_user_id ON transfers(user_id);
CREATE INDEX idx_transfers_user_occurred ON transfers(user_id, occurred_at DESC);
CREATE INDEX idx_transfers_kind ON transfers(user_id, kind);
