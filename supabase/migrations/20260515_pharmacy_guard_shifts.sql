-- ================================================================
-- PHARMACIES DE GARDE — Temps réel
-- ================================================================

insert into storage.buckets (id, name, public)
values ('pharmacy-guard-media', 'pharmacy-guard-media', true)
on conflict (id) do nothing;

create policy "Guard media public read" on storage.objects
  for select using (bucket_id = 'pharmacy-guard-media');
create policy "Guard media insert auth" on storage.objects
  for insert with check (bucket_id = 'pharmacy-guard-media' and auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS pharmacy_guard_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  city TEXT NOT NULL,
  zone TEXT,
  lat FLOAT,
  lng FLOAT,
  guard_date DATE NOT NULL DEFAULT CURRENT_DATE,
  starts_at TIME,
  ends_at TIME,
  is_verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verification_count INT DEFAULT 1,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_name TEXT,
  notes TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pgs_city_date ON pharmacy_guard_shifts(city, guard_date DESC);
CREATE INDEX IF NOT EXISTS idx_pgs_coords ON pharmacy_guard_shifts(lat, lng);
CREATE INDEX IF NOT EXISTS idx_pgs_status ON pharmacy_guard_shifts(status, guard_date DESC);

ALTER TABLE pharmacy_guard_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pgs_select_all" ON pharmacy_guard_shifts FOR SELECT USING (true);
CREATE POLICY "pgs_insert_auth" ON pharmacy_guard_shifts FOR INSERT WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "pgs_update_own" ON pharmacy_guard_shifts FOR UPDATE USING (auth.uid() = reported_by);
CREATE POLICY "pgs_delete_own" ON pharmacy_guard_shifts FOR DELETE USING (auth.uid() = reported_by);

-- Realtime
BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE pharmacy_guard_shifts;
COMMIT;

-- RPC to increment verification count
CREATE OR REPLACE FUNCTION increment_guard_verification(shift_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE pharmacy_guard_shifts
  SET verification_count = verification_count + 1
  WHERE id = shift_id;
END;
$$ LANGUAGE plpgsql;
