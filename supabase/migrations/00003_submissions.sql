-- Add deadline to texts
ALTER TABLE texts ADD COLUMN deadline TIMESTAMPTZ;

-- Create submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  text_id UUID REFERENCES texts(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'locked')) DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, text_id)
);

-- RLS for submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Students can see and manage their own submissions
CREATE POLICY "Students manage their own submissions" ON submissions
  FOR ALL USING (
    student_id = (SELECT id FROM students WHERE auth_user_id = auth.uid() LIMIT 1)
  );

-- Teachers can see submissions for texts in their classes
CREATE POLICY "Teachers see submissions for their texts" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM texts
      JOIN classes ON texts.class_id = classes.id
      WHERE texts.id = submissions.text_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- For students without auth_user_id yet (if using PIN), allow public management based on just student_id
-- We'll allow public select/insert/update for now, similar to other tables, 
-- but in the app we restrict based on the current active student session.
CREATE POLICY "Public manage submissions" ON submissions
  FOR ALL USING (true);

-- Drop submitted_texts array from students, as we are migrating to the submissions table
-- (Optional: We could migrate the data first. Let's do a simple data migration)
INSERT INTO submissions (student_id, text_id, status, submitted_at)
SELECT 
  id as student_id,
  unnest(submitted_texts) as text_id,
  'submitted' as status,
  now() as submitted_at
FROM students
WHERE submitted_texts IS NOT NULL AND array_length(submitted_texts, 1) > 0;

-- Now drop the column
ALTER TABLE students DROP COLUMN IF EXISTS submitted_texts;
