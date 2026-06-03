import type { Match } from "./getMatches";
import type { MatchResult } from "./ranking";

export type TournamentPhase =
  | "INICIO"
  | "FASE_DE_GRUPOS"
  | "FASE_16"
  | "OITAVAS"
  | "QUARTAS"
  | "SEMI_FINAIS"
  | "FINAIS"
  | "FIM";

export type CompetitionPhase =
  | "Fase de grupos"
  | "16 avos de final"
  | "Oitavas"
  | "Quartas"
  | "Semi finais"
  | "Finais";

export interface PhaseScheduleEntry {
  startsAt: string;
}

export type PhaseSchedule = Record<TournamentPhase, PhaseScheduleEntry>;

export interface PhaseState {
  currentPhase: TournamentPhase;
  currentPhaseLabel: string;
  editablePhase: CompetitionPhase | null;
  editablePhaseLabel: string | null;
  isReadOnly: boolean;
  phaseStartAt: string | null;
  editablePhaseLockAt: string | null;
}

export const TOURNAMENT_PHASES: TournamentPhase[] = [
  "INICIO",
  "FASE_DE_GRUPOS",
  "FASE_16",
  "OITAVAS",
  "QUARTAS",
  "SEMI_FINAIS",
  "FINAIS",
  "FIM",
];

export const TOURNAMENT_PHASE_LABELS: Record<TournamentPhase, string> = {
  INICIO: "Início",
  FASE_DE_GRUPOS: "Fase de grupos",
  FASE_16: "16 avos de final",
  OITAVAS: "Oitavas",
  QUARTAS: "Quartas",
  SEMI_FINAIS: "Semi finais",
  FINAIS: "Finais",
  FIM: "Fim",
};

export const COMPETITION_PHASE_LABELS: CompetitionPhase[] = [
  "Fase de grupos",
  "16 avos de final",
  "Oitavas",
  "Quartas",
  "Semi finais",
  "Finais",
];

export const CUMULATIVE_COMPETITION_PHASES: Record<
  TournamentPhase,
  CompetitionPhase[]
> = {
  INICIO: [],
  FASE_DE_GRUPOS: ["Fase de grupos"],
  FASE_16: ["Fase de grupos", "16 avos de final"],
  OITAVAS: ["Fase de grupos", "16 avos de final", "Oitavas"],
  QUARTAS: ["Fase de grupos", "16 avos de final", "Oitavas", "Quartas"],
  SEMI_FINAIS: [
    "Fase de grupos",
    "16 avos de final",
    "Oitavas",
    "Quartas",
    "Semi finais",
  ],
  FINAIS: COMPETITION_PHASE_LABELS,
  FIM: COMPETITION_PHASE_LABELS,
};

export const EDITABLE_PHASE_MAPPING: Partial<
  Record<TournamentPhase, CompetitionPhase | null>
> = {
  INICIO: "Fase de grupos",
  FASE_DE_GRUPOS: "16 avos de final",
  FASE_16: "Oitavas",
  OITAVAS: "Quartas",
  QUARTAS: "Semi finais",
  SEMI_FINAIS: "Finais",
  FINAIS: null,
  FIM: null,
};

const COMPETITION_TO_TOURNAMENT: Record<CompetitionPhase, TournamentPhase> = {
  "Fase de grupos": "FASE_DE_GRUPOS",
  "16 avos de final": "FASE_16",
  Oitavas: "OITAVAS",
  Quartas: "QUARTAS",
  "Semi finais": "SEMI_FINAIS",
  Finais: "FINAIS",
};

export function getCurrentPhaseLabel(phase: TournamentPhase) {
  return TOURNAMENT_PHASE_LABELS[phase];
}

export function getEditableCompetitionPhase(phase: TournamentPhase) {
  return EDITABLE_PHASE_MAPPING[phase] ?? null;
}

export function getVisibleCompetitionPhases(phase: TournamentPhase) {
  return CUMULATIVE_COMPETITION_PHASES[phase] ?? [];
}

export function normalizeCompetitionPhase(value: string) {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "fase de grupos":
      return "Fase de grupos";
    case "16 avos de final":
      return "16 avos de final";
    case "oitavas":
      return "Oitavas";
    case "quartas":
      return "Quartas";
    case "semi finais":
    case "semifinais":
      return "Semi finais";
    case "finais":
    case "final":
      return "Finais";
    default:
      return null;
  }
}

function parseDate(date?: string | null) {
  if (!date) return null;
  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function resolveCurrentPhaseBySchedule(
  schedule: PhaseSchedule,
  now: number,
): TournamentPhase {
  let current: TournamentPhase = "INICIO";
  let found = false;
  for (const phase of TOURNAMENT_PHASES) {
    const startsAt = parseDate(schedule[phase]?.startsAt);
    if (startsAt == null) {
      continue;
    }
    found = true;
    if (now >= startsAt) {
      current = phase;
    }
  }
  return found ? current : "INICIO";
}

export function resolvePhaseState(
  schedule: PhaseSchedule,
  matches: Array<Match | MatchResult>,
  nowInput: number | string | Date = Date.now(),
  overridePhase?: TournamentPhase | null,
): PhaseState {
  const now = new Date(nowInput).getTime();
  const currentPhase =
    overridePhase && TOURNAMENT_PHASES.includes(overridePhase)
      ? overridePhase
      : resolveCurrentPhaseBySchedule(schedule, now);
  const editablePhase = getEditableCompetitionPhase(currentPhase);
  const phaseStartAt = schedule[currentPhase]?.startsAt || null;
  const editablePhaseLockAt = editablePhase
    ? getPhaseLockAt(editablePhase, matches, schedule)
    : null;
  return {
    currentPhase,
    currentPhaseLabel: getCurrentPhaseLabel(currentPhase),
    editablePhase,
    editablePhaseLabel: editablePhase,
    isReadOnly: editablePhase == null,
    phaseStartAt,
    editablePhaseLockAt,
  };
}

export function getPhaseLockAt(
  editablePhase: CompetitionPhase,
  matches: Array<Match | MatchResult>,
  schedule: PhaseSchedule,
) {
  const phaseMatches = getMatchesForCompetitionPhase(matches, editablePhase);
  const matchStarts = phaseMatches
    .map((match) => {
      if (!("fixture" in match)) {
        return null;
      }
      return match.fixture?.utcDate || null;
    })
    .filter((value): value is string => value != null)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  if (matchStarts.length > 0) {
    return matchStarts[0];
  }
  const targetPhase = COMPETITION_TO_TOURNAMENT[editablePhase];
  return schedule[targetPhase]?.startsAt || null;
}

export function getMatchesForCompetitionPhase<T extends Match | MatchResult>(
  matches: T[],
  phase: CompetitionPhase,
) {
  return matches.filter(
    (match) => normalizeCompetitionPhase(match.fase) === phase,
  );
}
