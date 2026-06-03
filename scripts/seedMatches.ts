import type { FootballMatchesResponse } from "../lib/getFootballFixture";
import apiFootball from "../lib/apiFootball";
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadLocalEnv();

const FOOTBALL_DATA_ORG_COMPETITION =
  process.env.FOOTBALL_DATA_ORG_COMPETITION || "WC";
const FOOTBALL_DATA_ORG_SEASON = process.env.FOOTBALL_DATA_ORG_SEASON || "2026";
const cliOptions = parseCliArgs(process.argv.slice(2));

type CompetitionPhase =
  | "Fase de grupos"
  | "16 avos de final"
  | "Oitavas"
  | "Quartas"
  | "Semi finais"
  | "Finais";

interface MatchSeedRow {
  sequence: number;
  home_team: string;
  away_team: string;
  fase: CompetitionPhase;
  fixture_id: number;
  group_name: string | null;
}

interface ExistingMatchRow {
  id: number;
  fixture_id: number | null;
}

async function main() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
  requireEnv("FOOTBAL_DATA_ORG_API_KEY");

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const query = new URLSearchParams({
    season: FOOTBALL_DATA_ORG_SEASON,
  });
  if (cliOptions.phase) {
    query.set("stage", cliOptions.phase);
  }

  const payload = await apiFootball<FootballMatchesResponse>(
    `/competitions/${FOOTBALL_DATA_ORG_COMPETITION}/matches?${query.toString()}`,
  );

  const mappedMatches = payload.matches
    .slice()
    .sort(sortMatches)
    .map(mapMatch)
    .filter((match): match is Omit<MatchSeedRow, "sequence"> => match != null)
    .map((match, index) => ({
      ...match,
      sequence: index + 1,
    }));

  const skippedCount = payload.matches.length - mappedMatches.length;

  const { data: existingRows, error: existingError } = await supabase
    .from("matches")
    .select("id, fixture_id");

  if (existingError) {
    throw new Error(
      `Failed to load existing matches: ${existingError.message}`,
    );
  }

  const existingByFixtureID = new Map<number, ExistingMatchRow>();
  for (const row of (existingRows || []) as ExistingMatchRow[]) {
    if (row.fixture_id == null) continue;
    existingByFixtureID.set(row.fixture_id, row);
  }

  const inserts: MatchSeedRow[] = [];
  const updates: Array<MatchSeedRow & { id: number }> = [];

  for (const match of mappedMatches) {
    const existing = existingByFixtureID.get(match.fixture_id);
    if (existing) {
      updates.push({
        id: existing.id,
        ...match,
      });
      continue;
    }
    inserts.push(match);
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from("matches").insert(inserts);
    if (error) {
      throw new Error(`Failed to insert matches: ${error.message}`);
    }
  }

  if (updates.length > 0) {
    const { error } = await supabase
      .from("matches")
      .upsert(updates, { onConflict: "id" });
    if (error) {
      throw new Error(`Failed to update matches: ${error.message}`);
    }
  }

  console.info(
    [
      `Fetched ${payload.matches.length} matches`,
      cliOptions.phase ? `stage ${cliOptions.phase}` : "all stages",
      `inserted ${inserts.length}`,
      `updated ${updates.length}`,
      `skipped ${skippedCount}`,
    ].join(" | "),
  );
}

function loadLocalEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) {
      loadEnv({ path, override: false });
    }
  }
}

function requireEnv(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseCliArgs(args: string[]) {
  let phase: string | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--phase") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Missing value for --phase");
      }
      phase = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--phase=")) {
      phase = arg.slice("--phase=".length) || null;
      if (!phase) {
        throw new Error("Missing value for --phase");
      }
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { phase };
}

function sortMatches(
  a: FootballMatchesResponse["matches"][number],
  b: FootballMatchesResponse["matches"][number],
) {
  const timeDiff =
    new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }
  return a.id - b.id;
}

function mapMatch(
  match: FootballMatchesResponse["matches"][number],
): Omit<MatchSeedRow, "sequence"> | null {
  const fase = mapStageToPhase(match.stage);
  if (!fase) {
    console.warn(
      `Skipping unsupported stage "${match.stage || "UNKNOWN"}" for match ${match.id}`,
    );
    return null;
  }

  return {
    home_team: match.homeTeam.name,
    away_team: match.awayTeam.name,
    fase,
    fixture_id: match.id,
    group_name:
      fase === "Fase de grupos" ? normalizeGroupName(match.group) : null,
  };
}

function mapStageToPhase(stage?: string | null): CompetitionPhase | null {
  switch (stage) {
    case "GROUP_STAGE":
      return "Fase de grupos";
    case "LAST_32":
      return "16 avos de final";
    case "LAST_16":
      return "Oitavas";
    case "QUARTER_FINALS":
      return "Quartas";
    case "SEMI_FINALS":
      return "Semi finais";
    case "THIRD_PLACE":
    case "FINAL":
      return "Finais";
    default:
      return null;
  }
}

function normalizeGroupName(group?: string | null) {
  if (!group) return null;
  const normalized = group.trim().toUpperCase();
  const match = normalized.match(/GROUP[_ ]?([A-Z0-9]+)/);
  if (match) {
    return `Grupo ${match[1]}`;
  }
  return group.trim();
}

main().catch((error) => {
  console.error("seedMatches failed", error);
  process.exitCode = 1;
});
