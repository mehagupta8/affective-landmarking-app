-- annotations and writing_submissions were created with student_id NOT NULL.
-- Guest rows need student_id to be NULL (guest_id is set instead).
ALTER TABLE annotations ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE writing_submissions ALTER COLUMN student_id DROP NOT NULL;
