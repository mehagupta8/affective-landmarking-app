-- 00006_add_teacher_profiles.sql
-- Stores teacher onboarding info collected on first login (before dashboard access).

CREATE TABLE IF NOT EXISTS teacher_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    institution TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers read own profile" ON teacher_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Teachers insert own profile" ON teacher_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers update own profile" ON teacher_profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
