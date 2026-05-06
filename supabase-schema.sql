-- ================================================================
-- میرزایی کوچ — Supabase Schema
-- این فایل را در Supabase → SQL Editor اجرا کنید
-- ================================================================

-- جدول افراد
CREATE TABLE IF NOT EXISTS people (
  id          TEXT PRIMARY KEY,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL DEFAULT '',
  team        TEXT NOT NULL DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TEXT NOT NULL
);

-- جدول رویدادها
CREATE TABLE IF NOT EXISTS org_events (
  id          TEXT PRIMARY KEY,
  person_id   TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  raw_value   NUMERIC NOT NULL,
  pv          NUMERIC,
  score       NUMERIC NOT NULL,
  date        TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  note        TEXT
);

-- جدول تنظیمات (یک ردیف ثابت با id='default')
CREATE TABLE IF NOT EXISTS settings (
  id              TEXT PRIMARY KEY DEFAULT 'default',
  coefficients    JSONB NOT NULL DEFAULT '{}',
  pv_per_million  NUMERIC NOT NULL DEFAULT 1
);

-- ایندکس برای کوئری‌های پرکاربرد
CREATE INDEX IF NOT EXISTS idx_events_person_id ON org_events(person_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON org_events(date);

-- ================================================================
-- Row Level Security — برای اپ شخصی می‌توانید ساده‌ترین حالت را انتخاب کنید
-- ================================================================

ALTER TABLE people    ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings  ENABLE ROW LEVEL SECURITY;

-- گزینه ۱ (ساده): دسترسی کامل با anon key — مناسب استفاده شخصی
-- اگر اپ فقط توسط خودتان استفاده می‌شود این را اجرا کنید:
CREATE POLICY "anon full access people"    ON people    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon full access events"    ON org_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon full access settings"  ON settings  FOR ALL USING (true) WITH CHECK (true);

-- ================================================================
-- نکته: مقادیر VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY را از
-- Supabase → Settings → API بگیرید و در فایل .env پروژه قرار دهید:
--
-- VITE_SUPABASE_URL=https://xxxxx.supabase.co
-- VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
-- ================================================================
