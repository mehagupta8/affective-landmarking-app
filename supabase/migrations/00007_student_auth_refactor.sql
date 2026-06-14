-- 00007_student_auth_refactor.sql
--
-- Replaces the old `students` table (auth identity + class membership in one row)
-- with two clean tables:
--
--   student_profiles   — who the student is (linked to auth.users)
--   class_enrollments  — which classes they're in
--
-- annotations and writing_submissions are recreated pointing to student_profiles.

-- ============================================================
-- 1. Drop old tables (data was cleared before running this)
-- ============================================================

DROP TABLE IF EXISTS writing_submissions CASCADE;
DROP TABLE IF EXISTS annotations CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- ============================================================
-- 2. student_profiles
-- ============================================================

CREATE TABLE student_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own profile" ON student_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students insert own profile" ON student_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Students update own profile" ON student_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers read enrolled student profiles" ON student_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = student_profiles.id
        AND c.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- 3. class_enrollments
-- ============================================================

CREATE TABLE class_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at  TIMESTAMPTZ,
  submitted_texts UUID[] DEFAULT '{}',
  UNIQUE (student_id, class_id)
);

ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own enrollments" ON class_enrollments
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students insert own enrollment" ON class_enrollments
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students update own enrollment" ON class_enrollments
  FOR UPDATE USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers manage class enrollments" ON class_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_enrollments.class_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- 4. Recreate annotations → student_profiles
-- ============================================================

CREATE TABLE annotations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_id       UUID NOT NULL REFERENCES texts(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  start_offset  INTEGER NOT NULL,
  end_offset    INTEGER NOT NULL,
  rasa_label    rasa_label NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own annotations" ON annotations
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers read class annotations" ON annotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM texts
      JOIN classes ON texts.class_id = classes.id
      WHERE texts.id = annotations.text_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- 5. Recreate writing_submissions → student_profiles
-- ============================================================

CREATE TABLE writing_submissions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_id                 UUID NOT NULL REFERENCES texts(id) ON DELETE CASCADE,
  student_id              UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  content                 TEXT NOT NULL,
  prompt_type             TEXT CHECK (prompt_type IN ('choice', 'random')),
  selected_emotion        rasa_label,
  selected_annotation_ids UUID[],
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (text_id, student_id)
);

ALTER TABLE writing_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own writing" ON writing_submissions
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers read class writing" ON writing_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM texts
      JOIN classes ON texts.class_id = classes.id
      WHERE texts.id = writing_submissions.text_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- 6. Indexes
-- ============================================================

CREATE INDEX idx_enrollments_student ON class_enrollments (student_id);
CREATE INDEX idx_enrollments_class   ON class_enrollments (class_id);
CREATE INDEX idx_annotations_text    ON annotations (text_id);
CREATE INDEX idx_annotations_student ON annotations (student_id);
CREATE INDEX idx_writing_text        ON writing_submissions (text_id);
CREATE INDEX idx_writing_student     ON writing_submissions (student_id);
