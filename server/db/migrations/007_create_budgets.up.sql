CREATE TABLE budgets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
    period       VARCHAR(10) NOT NULL CHECK (period IN ('Weekly', 'Monthly', 'Yearly')),
    limit_amount BIGINT NOT NULL DEFAULT 0 CHECK (limit_amount >= 0),
    spent        BIGINT NOT NULL DEFAULT 0 CHECK (spent >= 0),
    icon         VARCHAR(50) NOT NULL DEFAULT 'Tag',
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
