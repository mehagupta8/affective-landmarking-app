-- Create the rasa_label enum
CREATE TYPE rasa_label AS ENUM (
  'fear', 
  'joy', 
  'anger', 
  'wonder', 
  'disgust', 
  'love', 
  'heroism', 
  'sadness'
);

-- 1. Classes
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  class_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Texts
CREATE TABLE texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  trigger_warning TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  pin TEXT, -- 4-digit PIN
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, name)
);

-- 4. Annotations
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_id UUID REFERENCES texts(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  rasa_label rasa_label NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

-- Classes: Teachers can see/manage their own classes
CREATE POLICY "Teachers manage their own classes" ON classes
  FOR ALL USING (auth.uid() = teacher_id);

-- Texts: Teachers manage their own class texts; Students can read if they have a valid class code (via join)
-- For simplicity in MVP, we allow public read of texts. In production, we'd check the class_code.
CREATE POLICY "Public read texts" ON texts
  FOR SELECT USING (true);

CREATE POLICY "Teachers manage texts" ON texts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = texts.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Students: Public insert (to join); Teachers manage
CREATE POLICY "Public insert students" ON students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read students" ON students
  FOR SELECT USING (true);

CREATE POLICY "Teachers manage students" ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Annotations: Public insert/read; Teachers manage
CREATE POLICY "Public insert annotations" ON annotations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read annotations" ON annotations
  FOR SELECT USING (true);

CREATE POLICY "Teachers manage annotations" ON annotations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM texts
      JOIN classes ON texts.class_id = classes.id
      WHERE texts.id = annotations.text_id 
      AND classes.teacher_id = auth.uid()
    )
  );
