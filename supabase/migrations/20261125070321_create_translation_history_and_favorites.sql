/*
# Create translation_history and favorites tables

1. Overview
- Adds two single-tenant tables for the LinguaFlow AI translator.
- `translation_history` records every completed translation (source/target lang, text, result).
- `favorites` stores starred translations the user wants to keep.
- No auth / sign-in in this app, so both tables are public/shared (single-tenant).
- A `is_favorite` boolean on history lets a history row be starred in place; the
  `favorites` table is kept as a dedicated, user-curated list that may duplicate a
  history row's content for display in the Favorites view.

2. New Tables

## translation_history
- `id` (uuid, primary key)
- `source_lang` (text, not null) — source language code (e.g. "auto", "en", "te")
- `target_lang` (text, not null) — target language code
- `source_text` (text, not null) — original text
- `target_text` (text, not null) — translated text
- `detected_source` (text, nullable) — detected source language code when source=auto
- `created_at` (timestamptz, default now())

## favorites
- `id` (uuid, primary key)
- `source_lang` (text, not null)
- `target_lang` (text, not null)
- `source_text` (text, not null)
- `target_text` (text, not null)
- `note` (text, nullable) — optional user note
- `created_at` (timestamptz, default now())

3. Indexes
- `translation_history_created_at_idx` on (created_at desc) for recent-first listing.
- `favorites_created_at_idx` on (created_at desc).

4. Security
- Enable RLS on both tables.
- Grant CRUD to `anon, authenticated` (no-auth app; data is intentionally public/shared).
- Four separate policies per table (select/insert/update/delete) with USING/WITH CHECK (true),
  documented as intentionally public because this is a single-tenant app with no sign-in.
*/

CREATE TABLE IF NOT EXISTS translation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_lang text NOT NULL,
  target_lang text NOT NULL,
  source_text text NOT NULL,
  target_text text NOT NULL,
  detected_source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_lang text NOT NULL,
  target_lang text NOT NULL,
  source_text text NOT NULL,
  target_text text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS translation_history_created_at_idx
  ON translation_history (created_at DESC);

CREATE INDEX IF NOT EXISTS favorites_created_at_idx
  ON favorites (created_at DESC);

ALTER TABLE translation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON translation_history TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON favorites TO anon, authenticated;

-- translation_history policies (intentionally public: single-tenant, no auth)
DROP POLICY IF EXISTS "th_select" ON translation_history;
CREATE POLICY "th_select" ON translation_history
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "th_insert" ON translation_history;
CREATE POLICY "th_insert" ON translation_history
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "th_update" ON translation_history;
CREATE POLICY "th_update" ON translation_history
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "th_delete" ON translation_history;
CREATE POLICY "th_delete" ON translation_history
  FOR DELETE TO anon, authenticated USING (true);

-- favorites policies (intentionally public: single-tenant, no auth)
DROP POLICY IF EXISTS "fav_select" ON favorites;
CREATE POLICY "fav_select" ON favorites
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "fav_insert" ON favorites;
CREATE POLICY "fav_insert" ON favorites
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "fav_update" ON favorites;
CREATE POLICY "fav_update" ON favorites
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "fav_delete" ON favorites;
CREATE POLICY "fav_delete" ON favorites
  FOR DELETE TO anon, authenticated USING (true);
