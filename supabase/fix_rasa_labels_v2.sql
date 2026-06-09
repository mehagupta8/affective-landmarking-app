DROP TYPE IF EXISTS rasa_label CASCADE;

CREATE TYPE rasa_label AS ENUM ('fear', 'joy', 'anger', 'wonder', 'disgust', 'love', 'heroism', 'sadness');

CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_id UUID REFERENCES texts(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  rasa_label rasa_label NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert annotations" ON annotations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read annotations" ON annotations FOR SELECT USING (true);
CREATE POLICY "Teachers manage annotations" ON annotations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM texts JOIN classes ON texts.class_id = classes.id
    WHERE texts.id = annotations.text_id AND classes.teacher_id = auth.uid()
  )
);
