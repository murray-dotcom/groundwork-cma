-- NOTE: This file must be applied manually in the Groundwork Supabase project SQL editor.
-- It is not run against this project's local database.

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read transactions"
ON transactions
FOR SELECT
USING (true);
