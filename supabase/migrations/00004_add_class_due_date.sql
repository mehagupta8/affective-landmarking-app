-- 00004_add_class_due_date.sql
ALTER TABLE classes ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
