CREATE TABLE patungan_groups (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(120) NOT NULL CHECK (char_length(trim(name)) > 0),
    note           VARCHAR(255) NOT NULL DEFAULT '',
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE patungan_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES patungan_groups(id) ON DELETE CASCADE,
    display_name    VARCHAR(80) NOT NULL CHECK (char_length(trim(display_name)) > 0),
    linked_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_patungan_participants_group_name
    ON patungan_participants (group_id, lower(display_name));

CREATE UNIQUE INDEX idx_patungan_participants_group_user
    ON patungan_participants (group_id, linked_user_id)
    WHERE linked_user_id IS NOT NULL;

CREATE INDEX idx_patungan_participants_group_id ON patungan_participants(group_id);
CREATE INDEX idx_patungan_participants_linked_user ON patungan_participants(linked_user_id);

CREATE TABLE patungan_expenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES patungan_groups(id) ON DELETE CASCADE,
    payer_member_id UUID NOT NULL REFERENCES patungan_participants(id) ON DELETE RESTRICT,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    total_amount    BIGINT NOT NULL CHECK (total_amount > 0),
    note            VARCHAR(255) NOT NULL DEFAULT '',
    occurred_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE patungan_splits (
    expense_id   UUID NOT NULL REFERENCES patungan_expenses(id) ON DELETE CASCADE,
    member_id    UUID NOT NULL REFERENCES patungan_participants(id) ON DELETE CASCADE,
    share_amount BIGINT NOT NULL CHECK (share_amount >= 0),
    PRIMARY KEY (expense_id, member_id)
);

CREATE TABLE patungan_settlements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES patungan_groups(id) ON DELETE CASCADE,
    from_member_id  UUID NOT NULL REFERENCES patungan_participants(id) ON DELETE RESTRICT,
    to_member_id    UUID NOT NULL REFERENCES patungan_participants(id) ON DELETE RESTRICT,
    amount          BIGINT NOT NULL CHECK (amount > 0),
    note            VARCHAR(255) NOT NULL DEFAULT '',
    occurred_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT patungan_settlements_different_members CHECK (from_member_id <> to_member_id)
);

CREATE INDEX idx_patungan_groups_creator ON patungan_groups(creator_user_id);
CREATE INDEX idx_patungan_expenses_group ON patungan_expenses(group_id, occurred_at DESC);
CREATE INDEX idx_patungan_expenses_payer ON patungan_expenses(group_id, payer_member_id);
CREATE INDEX idx_patungan_splits_member ON patungan_splits(member_id);
CREATE INDEX idx_patungan_settlements_group ON patungan_settlements(group_id, occurred_at DESC);
CREATE INDEX idx_patungan_settlements_from ON patungan_settlements(group_id, from_member_id);
CREATE INDEX idx_patungan_settlements_to ON patungan_settlements(group_id, to_member_id);
