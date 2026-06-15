-- 20260614200000_add_guest_sessions.sql
-- Adds guest (Kahoot-style) participation to classes.

-- 1. Allow teachers to enable guest access per class
ALTER TABLE classes ADD COLUMN IF NOT EXISTS allow_guests BOOLEAN NOT NULL DEFAULT false;

-- 2. Guest sessions — one row per guest join, no auth.users reference
CREATE TABLE guest_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  submitted_texts UUID[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at  TIMESTAMPTZ
);

ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

-- Guests have no auth.uid() so we use permissive public policies
-- (same pattern as the old students table). The JWT cookie is the access control.
CREATE POLICY "Public insert guest sessions" ON guest_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read guest sessions" ON guest_sessions
  FOR SELECT USING (true);

CREATE POLICY "Public update guest sessions" ON guest_sessions
  FOR UPDATE USING (true) WITH CHECK (true);

-- Teachers can also read guest sessions for their classes
CREATE POLICY "Teachers read guest sessions" ON guest_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = guest_sessions.class_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- 3. Add nullable guest_id to annotations (either student_id or guest_id is set)
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guest_sessions(id) ON DELETE CASCADE;

-- 4. Add nullable guest_id to writing_submissions
ALTER TABLE writing_submissions ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guest_sessions(id) ON DELETE CASCADE;

-- 4b. Guest annotation policies (anon key, no auth.uid())
CREATE POLICY "Guests manage own annotations" ON annotations
  FOR ALL USING (guest_id IS NOT NULL) WITH CHECK (guest_id IS NOT NULL);

CREATE POLICY "Guests manage own writing" ON writing_submissions
  FOR ALL USING (guest_id IS NOT NULL) WITH CHECK (guest_id IS NOT NULL);

-- 5. Index for lookups
CREATE INDEX idx_guest_sessions_class ON guest_sessions (class_id);
CREATE INDEX idx_annotations_guest ON annotations (guest_id);
CREATE INDEX idx_writing_guest ON writing_submissions (guest_id);
