-- ============================================================
-- BJ Golf 2026 — Supabase Database Setup
-- Paste this entire file into the Supabase SQL Editor and run it.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tables ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS players (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  handicap   integer,
  team       text        CHECK (team IN ('A', 'B')),
  avatar     text,
  pin_code   text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id     text PRIMARY KEY,
  name   text,
  type   text,   -- 'individual' | 'team' | 'ryder'
  day    integer,
  status text DEFAULT 'upcoming'  -- 'upcoming' | 'live' | 'completed'
);

CREATE TABLE IF NOT EXISTS scores (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   uuid        REFERENCES players(id) ON DELETE CASCADE,
  event_id    text        REFERENCES events(id)  ON DELETE CASCADE,
  hole_number integer     CHECK (hole_number BETWEEN 1 AND 18),
  strokes     integer     CHECK (strokes > 0),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (player_id, event_id, hole_number)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  uuid        REFERENCES players(id) ON DELETE CASCADE,
  message    text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  uuid        REFERENCES players(id) ON DELETE CASCADE,
  image_url  text        NOT NULL,
  caption    text,
  day        integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_results (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id text        NOT NULL,
  player_id    uuid        REFERENCES players(id) ON DELETE CASCADE,
  value        numeric     NOT NULL,  -- feet (CTP) or yards (LD)
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text        NOT NULL,  -- 'birdie' | 'eagle' | 'challenge'
  message    text        NOT NULL,
  player_id  uuid        REFERENCES players(id) ON DELETE CASCADE,
  read       boolean     DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── Supabase Realtime ─────────────────────────────────────────
-- Enable realtime on these tables (run if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE scores;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE players           ENABLE ROW LEVEL SECURITY;
ALTER TABLE events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;

-- players: public read
CREATE POLICY "Public read players"
  ON players FOR SELECT USING (true);

-- events: public read
CREATE POLICY "Public read events"
  ON events FOR SELECT USING (true);

-- scores: public read, authenticated write (PIN-based app uses anon key)
CREATE POLICY "Public read scores"
  ON scores FOR SELECT USING (true);
CREATE POLICY "Public insert scores"
  ON scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update scores"
  ON scores FOR UPDATE USING (true);

-- chat_messages: public read, insert for all
CREATE POLICY "Public read chat"
  ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Public insert chat"
  ON chat_messages FOR INSERT WITH CHECK (true);

-- photos: public read, insert for all
CREATE POLICY "Public read photos"
  ON photos FOR SELECT USING (true);
CREATE POLICY "Public insert photos"
  ON photos FOR INSERT WITH CHECK (true);

-- challenge_results: public read/insert
CREATE POLICY "Public read challenge_results"
  ON challenge_results FOR SELECT USING (true);
CREATE POLICY "Public insert challenge_results"
  ON challenge_results FOR INSERT WITH CHECK (true);

-- notifications: public read/insert/update
CREATE POLICY "Public read notifications"
  ON notifications FOR SELECT USING (true);
CREATE POLICY "Public insert notifications"
  ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update notifications"
  ON notifications FOR UPDATE USING (true);

-- ── Seed: Events ─────────────────────────────────────────────
INSERT INTO events (id, name, type, day, status) VALUES
  ('ind', 'Individual Stroke Play', 'individual', 1, 'upcoming'),
  ('bb',  'Best Ball',              'team',       2, 'upcoming'),
  ('scr', 'Scramble',               'team',       2, 'upcoming'),
  ('alt', 'Alternate Shot',         'team',       3, 'upcoming'),
  ('rc',  'Ryder Cup Singles',      'ryder',      3, 'upcoming')
ON CONFLICT (id) DO NOTHING;

-- ── Seed: Players ────────────────────────────────────────────
INSERT INTO players (name, handicap, team, avatar, pin_code) VALUES
  ('Carlos M.',    12, 'A', 'CM', '1001'),
  ('Eduardo C.',      8, 'A', 'EC', '1002'),
  ('Mario C.',    15, 'A', 'MC', '1003'),
  ('Hector L.', 10, 'A', 'HL', '1004'),
  ('Marco S.',    6, 'A', 'MS', '1005'),
  ('Callum Y.',    18, 'B', 'CY', '2001'),
  ('Jaime C.',    11, 'B', 'JC', '2002'),
  ('Nate.',      9, 'B', 'NT', '2003'),
  ('Mychal D.',  14, 'B', 'MD', '2004'),
  ('AB.',  7, 'B', 'AB', '2005');

-- ── Storage: Photos bucket ────────────────────────────────────
-- Run this if the bucket doesn't exist yet:
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to the photos bucket
CREATE POLICY "Public upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Public read photo objects"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- ── Course Data (GolfCourseAPI) ───────────────────────────────

CREATE TABLE IF NOT EXISTS courses (
  id           text        PRIMARY KEY,           -- GolfCourseAPI course ID
  name         text        NOT NULL,
  data         jsonb       NOT NULL,              -- full API response
  selected_tee text,                              -- e.g. 'Blue', 'White'
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournament_settings (
  id               integer     PRIMARY KEY DEFAULT 1,
  active_course_id text        REFERENCES courses(id) ON DELETE SET NULL,
  tournament_name  text        NOT NULL DEFAULT 'BJ 2026',
  updated_at       timestamptz DEFAULT now()
);

-- Seed default tournament settings row
INSERT INTO tournament_settings (id, tournament_name)
VALUES (1, 'BJ 2026')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE courses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_settings  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read courses"
  ON courses FOR SELECT USING (true);
CREATE POLICY "Public insert courses"
  ON courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update courses"
  ON courses FOR UPDATE USING (true);

CREATE POLICY "Public read settings"
  ON tournament_settings FOR SELECT USING (true);
CREATE POLICY "Public insert settings"
  ON tournament_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update settings"
  ON tournament_settings FOR UPDATE USING (true);

-- ── Scores: extended stats ────────────────────────────────────
ALTER TABLE scores ADD COLUMN IF NOT EXISTS putts       integer CHECK (putts >= 0);
ALTER TABLE scores ADD COLUMN IF NOT EXISTS fairway_hit boolean;

-- ── Tee Times ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tee_times (
  player_id uuid    REFERENCES players(id) ON DELETE CASCADE,
  event_id  text    REFERENCES events(id)  ON DELETE CASCADE,
  tee_time  integer NOT NULL DEFAULT 1 CHECK (tee_time BETWEEN 1 AND 3),
  PRIMARY KEY (player_id, event_id)
);

ALTER TABLE tee_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tee_times"
  ON tee_times FOR SELECT USING (true);
CREATE POLICY "Public insert tee_times"
  ON tee_times FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tee_times"
  ON tee_times FOR UPDATE USING (true);
