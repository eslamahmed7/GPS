CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  accuracy float8 NOT NULL,
  created_at timestamptz DEFAULT now(),
  session_id text NOT NULL
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_locations" ON locations FOR INSERT
  TO anon WITH CHECK (true);

CREATE POLICY "select_locations" ON locations FOR SELECT
  TO anon USING (true);

CREATE POLICY "delete_locations" ON locations FOR DELETE
  TO anon USING (true);

CREATE POLICY "update_locations" ON locations FOR UPDATE
  TO anon USING (true);
