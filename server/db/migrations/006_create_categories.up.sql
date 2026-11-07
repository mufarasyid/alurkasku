CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(10) NOT NULL CHECK (type IN ('Income', 'Expense')),
    icon        VARCHAR(50) NOT NULL DEFAULT 'Tag',
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_user_type ON categories(user_id, type);

-- Backfill default categories for existing users (new users get the same
-- list from the seed hook on register).
INSERT INTO categories (user_id, name, type, icon)
SELECT u.id, v.name, v.type, v.icon
FROM users u
CROSS JOIN (VALUES
    ('Salary',              'Income',  'Briefcase'),
    ('Freelance',           'Income',  'Laptop'),
    ('Investments',         'Income',  'TrendingUp'),
    ('Food & Drinks',       'Expense', 'Utensils'),
    ('Transportation',      'Expense', 'Car'),
    ('Shopping',            'Expense', 'ShoppingBag'),
    ('Housing & Utilities', 'Expense', 'Home'),
    ('Health',              'Expense', 'HeartPulse'),
    ('Entertainment',       'Expense', 'Clapperboard'),
    ('Education',           'Expense', 'GraduationCap'),
    ('Travel',              'Expense', 'Plane'),
    ('Subscriptions',       'Expense', 'Repeat'),
    ('Gifts & Donations',   'Expense', 'Gift'),
    ('Coffee',              'Expense', 'Coffee')
) AS v(name, type, icon);
