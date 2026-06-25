import {
  FootballDataMatch,
  fetchFootballFixture,
} from "./getFootballFixture";

import { invalidateRankingCache } from "./ranking";
import { supabase } from "./supabaseClient";

export type CompetitionPhase =
  | "Fase de grupos"
  | "16 avos de final"
  | "Oitavas"
  | "Quartas"
  | "Semi finais"
  | "Finais";

export interface SyncSummary {
  fase: string | null;
  inserted: number;
  updated: number;
  skipped: number;
}

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
  sequence: number | null;
}

// Ordem das fases de mata-mata; a fase de grupos é a baseline do seed manual e
// fica fora da varredura automática do cron.
const KNOCKOUT_STAGE_ORDER = [
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
];

/**
 * Cron: encontra a primeira fase de mata-mata ainda não totalmente semeada e
 * grava apenas os jogos já definidos dela. Para na primeira fase pendente.
 */
export async function syncMatches(): Promise<SyncSummary> {
  const existingByFixtureID = await loadExistingByFixtureID();

  for (const stage of KNOCKOUT_STAGE_ORDER) {
    const response = await fetchFootballFixture({ stage });
    const stageMatches = response?.matches ?? [];
    const defined = stageMatches.filter(isDefinedMatch);

    const fullySeeded =
      stageMatches.length > 0 &&
      defined.length === stageMatches.length &&
      defined.every((m) => existingByFixtureID.has(m.id));

    if (fullySeeded) {
      continue;
    }

    // Fase pendente: pode ainda não ter jogos definidos (times TBD); nesse caso
    // não há o que gravar, mas paramos aqui mesmo assim.
    return finalize(await upsertDefinedMatches(stageMatches));
  }

  return { fase: null, inserted: 0, updated: 0, skipped: 0 };
}

/**
 * CLI: semeia um stage específico (ou todos, quando stage indefinido),
 * gravando apenas os jogos já definidos.
 */
export async function seedMatchesForStage(
  stage?: string,
): Promise<SyncSummary> {
  const response = await fetchFootballFixture(stage ? { stage } : undefined);
  return finalize(await upsertDefinedMatches(response?.matches ?? []));
}

/**
 * Núcleo compartilhado: filtra jogos definidos, particiona insert/update por
 * fixture_id e atribui sequence aos novos a partir de max(sequence)+1.
 */
async function upsertDefinedMatches(
  apiMatches: FootballDataMatch[],
): Promise<SyncSummary> {
  const mapped = apiMatches
    .filter(isDefinedMatch)
    .map((match) => ({ match, row: mapMatch(match) }))
    .filter(
      (entry): entry is { match: FootballDataMatch; row: SeedRowData } =>
        entry.row != null,
    )
    .sort((a, b) => sortMatches(a.match, b.match));

  const skipped = apiMatches.length - mapped.length;

  const { existingByFixtureID, maxSequence } =
    await loadExistingMatches();

  let nextSequence = maxSequence;
  const inserts: MatchSeedRow[] = [];
  const updates: Array<MatchSeedRow & { id: number }> = [];

  for (const { row } of mapped) {
    const existing = existingByFixtureID.get(row.fixture_id);
    if (existing) {
      updates.push({
        id: existing.id,
        sequence: existing.sequence ?? ++nextSequence,
        ...row,
      });
      continue;
    }
    inserts.push({ sequence: ++nextSequence, ...row });
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

  const fases = new Set(mapped.map(({ row }) => row.fase));
  const fase = fases.size === 1 ? [...fases][0] : null;

  return {
    fase,
    inserted: inserts.length,
    updated: updates.length,
    skipped,
  };
}

async function finalize(summary: SyncSummary): Promise<SyncSummary> {
  if (summary.inserted + summary.updated > 0) {
    try {
      await invalidateRankingCache();
    } catch (error) {
      console.error("Failed to invalidate ranking cache:", error);
    }
  }
  return summary;
}

async function loadExistingMatches(): Promise<{
  existingByFixtureID: Map<number, ExistingMatchRow>;
  maxSequence: number;
}> {
  const { data, error } = await supabase
    .from("matches")
    .select("id, fixture_id, sequence");
  if (error) {
    throw new Error(`Failed to load existing matches: ${error.message}`);
  }

  const existingByFixtureID = new Map<number, ExistingMatchRow>();
  let maxSequence = 0;
  for (const row of (data || []) as ExistingMatchRow[]) {
    if (row.fixture_id != null) {
      existingByFixtureID.set(row.fixture_id, row);
    }
    if (row.sequence != null && row.sequence > maxSequence) {
      maxSequence = row.sequence;
    }
  }
  return { existingByFixtureID, maxSequence };
}

async function loadExistingByFixtureID(): Promise<Map<number, ExistingMatchRow>> {
  const { existingByFixtureID } = await loadExistingMatches();
  return existingByFixtureID;
}

function isDefinedMatch(match: FootballDataMatch): boolean {
  return Boolean(match.homeTeam?.name && match.awayTeam?.name);
}

type SeedRowData = Omit<MatchSeedRow, "sequence">;

function mapMatch(match: FootballDataMatch): SeedRowData | null {
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

function sortMatches(a: FootballDataMatch, b: FootballDataMatch) {
  const timeDiff =
    new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }
  return a.id - b.id;
}
