-- Phase 1: Foundation Improvements

-- 1. Update texts table with new metadata columns
ALTER TABLE texts 
ADD COLUMN author TEXT,
ADD COLUMN publication_year INTEGER,
ADD COLUMN due_date TIMESTAMPTZ;

-- 2. Update students table
ALTER TABLE students 
ADD COLUMN last_login_at TIMESTAMPTZ,
ADD COLUMN submitted_at TIMESTAMPTZ;

-- Backfill existing students who have NULL PINs with a random 4-digit string
UPDATE students 
SET pin = LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') 
WHERE pin IS NULL;

-- Make PIN required (NOT NULL)
ALTER TABLE students 
ALTER COLUMN pin SET NOT NULL;

-- 3. Add index for student login lookups (class_id + name)
CREATE INDEX idx_students_class_name ON students (class_id, name);

-- 4. RLS Updates
-- Since students use a custom PIN-based flow without standard Supabase Auth,
-- we'll initially allow public updates to submitted_at for the student row,
-- which we will secure via server-side verification in the API layer.
CREATE POLICY "Students can update their own submission status" ON students
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Ensure public can read metadata for display
-- (Existing policies might already cover this, but being explicit for the new columns)
-- Note: 'Public read students' and 'Public read texts' already exist in 00001_initial.sql
