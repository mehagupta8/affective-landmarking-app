-- Remove PIN-based student authentication
ALTER TABLE students DROP COLUMN IF EXISTS pin;
