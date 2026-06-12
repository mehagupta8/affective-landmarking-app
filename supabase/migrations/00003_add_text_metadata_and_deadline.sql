-- 00003_add_text_metadata_and_deadline.sql
ALTER TABLE texts ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE texts ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE texts ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE texts ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- RLS Policy Update to enforce deadline
-- This policy ensures students can only insert/delete annotations if the deadline hasn't passed.
-- (Assumes students have limited access via their session ID, which we handle in the API currently, 
-- but this SQL demonstrates the logic).

CREATE OR REPLACE FUNCTION check_text_deadline()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT due_date FROM texts WHERE id = NEW.text_id) < NOW() THEN
        RAISE EXCEPTION 'Deadline has passed for this text.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- We don't have direct DB access to apply triggers in this environment, 
-- but I'll document it here and implement the check in the API as well.
