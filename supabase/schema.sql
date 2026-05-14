-- SQL to create the necessary tables in Supabase

-- 1. Players table
CREATE TABLE players (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Matches table
CREATE TABLE matches (
  id BIGINT PRIMARY KEY,
  sequence INT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  fase TEXT,
  fixture_id BIGINT,
  group_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Bets table
CREATE TABLE bets (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id),
  match_id BIGINT REFERENCES matches(id),
  home_goals INT,
  away_goals INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, match_id)
);

-- 4. Config table
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Optional, but recommended for production)
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE config ENABLE ROW LEVEL SECURITY;
