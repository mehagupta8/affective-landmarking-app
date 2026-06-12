ALTER TABLE students ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_students_auth_user_id ON students(auth_user_id);
