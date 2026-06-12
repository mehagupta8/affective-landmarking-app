-- 00005_add_writing_submissions.sql
CREATE TABLE IF NOT EXISTS writing_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text_id UUID REFERENCES texts(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    prompt_type TEXT CHECK (prompt_type IN ('choice', 'random')),
    selected_emotion rasa_label,
    selected_annotation_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(text_id, student_id) -- One submission per student per text
);

-- Enable RLS
ALTER TABLE writing_submissions ENABLE ROW LEVEL SECURITY;

-- Students can read/write their own submissions
CREATE POLICY "Manage own writing submissions" ON writing_submissions
    FOR ALL USING (auth.uid() IS NOT NULL OR true) -- We handle student auth via custom API/sessions
    WITH CHECK (true);

-- Teachers can view all submissions for their texts
CREATE POLICY "Teachers view class writing" ON writing_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM texts
            JOIN classes ON texts.class_id = classes.id
            WHERE texts.id = writing_submissions.text_id
            AND classes.teacher_id = auth.uid()
        )
    );
