ALTER TABLE users
    DROP CONSTRAINT IF EXISTS chk_users_payday_day;

ALTER TABLE users
    DROP COLUMN payday_day;
