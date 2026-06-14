-- Students need to read classes by class_code to join.
-- The original policy only allowed teachers to see their own classes.
CREATE POLICY "Students read classes by code" ON classes
  FOR SELECT USING (true);
