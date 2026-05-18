-- ============================================================
-- The Race to the Cache — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ───────────────────────────────────────────────────
CREATE TYPE station_type    AS ENUM ('route', 'detour', 'roadblock');
CREATE TYPE progress_status AS ENUM ('active', 'completed');
CREATE TYPE game_event_type AS ENUM ('race_started', 'reveal_winner');

-- ── Tables ──────────────────────────────────────────────────

CREATE TABLE teams (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT        NOT NULL,
  access_code             TEXT        NOT NULL UNIQUE,
  started_at              TIMESTAMPTZ,
  finished_at             TIMESTAMPTZ,
  total_penalties_minutes INTEGER     NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stations (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_num     INTEGER      NOT NULL UNIQUE CHECK (order_num BETWEEN 1 AND 8),
  type          station_type NOT NULL DEFAULT 'route',
  title         TEXT         NOT NULL,
  content       TEXT         NOT NULL,
  solution_code TEXT         NOT NULL,
  hint          TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE team_progress (
  id           UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id      UUID            NOT NULL REFERENCES teams(id)    ON DELETE CASCADE,
  station_id   UUID            NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  status       progress_status NOT NULL DEFAULT 'active',
  completed_at TIMESTAMPTZ,
  hints_used   INTEGER         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, station_id)
);

CREATE TABLE game_events (
  id         UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       game_event_type NOT NULL,
  payload    JSONB,
  created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE teams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events   ENABLE ROW LEVEL SECURITY;

-- teams: anon clients can read + update (for timer/penalty updates via client)
CREATE POLICY "teams_select" ON teams
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "teams_update" ON teams
  FOR UPDATE TO anon, authenticated USING (true);

-- stations: fully public read (solution_code is only queried server-side)
CREATE POLICY "stations_select" ON stations
  FOR SELECT TO anon, authenticated USING (true);

-- team_progress: open read + write for race clients
CREATE POLICY "progress_select" ON team_progress
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "progress_insert" ON team_progress
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "progress_update" ON team_progress
  FOR UPDATE TO anon, authenticated USING (true);

-- game_events: clients read-only; admin inserts via service_role key
CREATE POLICY "events_select" ON game_events
  FOR SELECT TO anon, authenticated USING (true);

-- ── Realtime ────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE team_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE game_events;

-- ── Seed: placeholder stations (replace content with real riddles) ──
INSERT INTO stations (order_num, type, title, content, solution_code, hint) VALUES
  (1, 'route',     'ברוכים הבאים לפארק',   'תיאור החידה לתחנה 1 יכתב כאן. מצאו את X בפארק הירקון.',       'תשובה1',  'רמז לתחנה 1'),
  (2, 'route',     'על שפת הירקון',         'תיאור החידה לתחנה 2 יכתב כאן.',                                 'תשובה2',  'רמז לתחנה 2'),
  (3, 'detour',    'סיבוב — בחרו מסלול',    'תיאור החידה לתחנה 3 יכתב כאן.',                                 'תשובה3',  'רמז לתחנה 3'),
  (4, 'route',     'הגשר הגדול',            'תיאור החידה לתחנה 4 יכתב כאן.',                                 'תשובה4',  'רמז לתחנה 4'),
  (5, 'roadblock', 'מחסום — משימה אישית',   'תיאור החידה לתחנה 5 יכתב כאן.',                                 'תשובה5',  'רמז לתחנה 5'),
  (6, 'route',     'גן החיות הלאומי',       'תיאור החידה לתחנה 6 יכתב כאן.',                                 'תשובה6',  'רמז לתחנה 6'),
  (7, 'detour',    'סיבוב — שתי דרכים',     'תיאור החידה לתחנה 7 יכתב כאן.',                                 'תשובה7',  'רמז לתחנה 7'),
  (8, 'route',     'המטמון האחרון',         'הגעתם לתחנה האחרונה! פתרו את החידה הסופית כדי לסיים את המרוץ.', 'תשובה8',  'רמז לתחנה 8');
