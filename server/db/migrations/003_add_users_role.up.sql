ALTER TABLE users
    ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';

ALTER TABLE users
    ADD CONSTRAINT chk_users_role CHECK (role IN ('admin', 'user'));

CREATE INDEX idx_users_role ON users(role);
