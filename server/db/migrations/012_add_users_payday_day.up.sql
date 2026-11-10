ALTER TABLE users
    ADD COLUMN payday_day INTEGER;

ALTER TABLE users
    ADD CONSTRAINT chk_users_payday_day CHECK (payday_day IS NULL OR payday_day BETWEEN 1 AND 31);

COMMENT ON COLUMN users.payday_day IS 'Day of month (1-31) salary is paid; NULL means calendar month cycles';
