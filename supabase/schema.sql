-- SQL to create the necessary tables in Supabase

-- 1. Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  pix_key TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT users_cpf_digits CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT users_name_length CHECK (char_length(trim(name)) BETWEEN 3 AND 256),
  CONSTRAINT users_pix_key_length CHECK (char_length(trim(pix_key)) BETWEEN 8 AND 256),
  CONSTRAINT users_secret_hash_present CHECK (char_length(secret_hash) > 0)
);

-- 2. Players table
CREATE TABLE players (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT players_name_length CHECK (char_length(trim(name)) BETWEEN 3 AND 256)
);

-- 3. Matches table
CREATE TABLE matches (
  id BIGSERIAL PRIMARY KEY,
  sequence INT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  fase TEXT,
  fixture_id BIGINT UNIQUE,
  group_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bets table
CREATE TABLE bets (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT REFERENCES players(id),
  match_id BIGINT REFERENCES matches(id),
  home_goals INT,
  away_goals INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, match_id),
  CONSTRAINT bets_home_goals_range CHECK (home_goals IS NULL OR home_goals BETWEEN 0 AND 99),
  CONSTRAINT bets_away_goals_range CHECK (away_goals IS NULL OR away_goals BETWEEN 0 AND 99),
  CONSTRAINT bets_complete_score CHECK (
    (home_goals IS NULL AND away_goals IS NULL) OR
    (home_goals IS NOT NULL AND away_goals IS NOT NULL)
  )
);

-- 5. Config table
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Optional, but recommended for production)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Configuracao dos horarios das partidas

insert into config (key, value)
values
  (
    'phaseSchedule',
    '{
      "INICIO": { "startsAt": "2026-05-01T14:00:00-03:00" },
      "FASE_DE_GRUPOS": { "startsAt": "2026-06-11T14:00:00-03:00" },
      "FASE_16": { "startsAt": "2026-06-28T12:00:00-03:00" },
      "OITAVAS": { "startsAt": "2026-07-04T12:00:00-03:00" },
      "QUARTAS": { "startsAt": "2026-07-09T12:00:00-03:00" },
      "SEMI_FINAIS": { "startsAt": "2026-07-14T12:00:00-03:00" },
      "FINAIS": { "startsAt": "2026-07-19T14:00:00-03:00" },
      "FIM": { "startsAt": "2026-07-19T18:00:00-03:00" }
    }'::jsonb
  )
on conflict (key)
do update set
  value = excluded.value,
  updated_at = now();

-- Configuracao das regras

insert into config (key, value)
values
  ('timeZone', '"America/Sao_Paulo"'::jsonb),
  ('locale', '"pt-BR"'::jsonb),
  ('currency', '"BRL"'::jsonb),
  ('tournament', '{
    "title": "Bolão da Copa 2026",
    "season": 2026,
    "rulesUrl": ""
  }'::jsonb),
  ('pix', '{
    "merchantName": "Rodrigo Corsi Gasparetto",
    "merchantCity": "Sao Paulo",
    "pixKey": "rodrigocorsi@gmail.com"
  }'::jsonb),
  ('refreshTiming', '{
    "MIN_REFRESH_SEC": 10,
    "MAX_REFRESH_SEC": 60
  }'::jsonb),
  ('scorePoints', '{
    "EXACT": 12,
    "WINNER_AND_ONE_SCORE": 7,
    "WINNER": 5,
    "ONE_SCORE": 2
  }'::jsonb),
  ('prize', '{
    "BONUS": 1500,
    "GAME_VALUE": 50,
    "GENERAL": {
      "poolPart": 0.5,
      "positions": [0.6, 0.3, 0.1]
    },
    "PHASES": {
      "Fase de grupos": {
        "poolPart": 0.25,
        "positions": [0.6, 0.3, 0.1]
      },
      "Finais": {
        "poolPart": 0.25,
        "positions": [0.6, 0.3, 0.1]
      }
    },
    "FIRST_PLACE_PART": 0.6,
    "SECOND_PLACE_PART": 0.3,
    "THIRD_PLACE_PART": 0.1
  }'::jsonb)
on conflict (key)
do update set
  value = excluded.value,
  updated_at = now();
