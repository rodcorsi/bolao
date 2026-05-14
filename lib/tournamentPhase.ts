import type { Match } from "./getMatches";
import type { MatchResult } from "./ranking";

export type TournamentPhase =
  | "INICIO"
  | "FASE_DE_GRUPOS"
  | "SEGUNDA_FASE"
  | "OITAVAS"
  | "QUARTAS"
  | "SEMI_FINAIS"
  | "FINAIS"
  | "FIM";

export type CompetitionPhase =
  | "Fase de grupos"
  | "Segunda fase"
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
  "SEGUNDA_FASE",
  "OITAVAS",
  "QUARTAS",
  "SEMI_FINAIS",
  "FINAIS",
  "FIM",
];

export const TOURNAMENT_PHASE_LABELS: Record<TournamentPhase, string> = {
  INICIO: "Início",
  FASE_DE_GRUPOS: "Fase de grupos",
  SEGUNDA_FASE: "Segunda fase",
  OITAVAS: "Oitavas",
  QUARTAS: "Quartas",
  SEMI_FINAIS: "Semi finais",
  FINAIS: "Finais",
  FIM: "Fim",
};

export const COMPETITION_PHASE_LABELS: CompetitionPhase[] = [
  "Fase de grupos",
  "Segunda fase",
  "Oitavas",
  "Quartas",
  "Semi finais",
  "Finais",
];

const EDITABLE_PHASE_BY_PHASE: Partial<
  Record<TournamentPhase, CompetitionPhase | null>
> = {
  INICIO: "Fase de grupos",
  FASE_DE_GRUPOS: "Segunda fase",
  SEGUNDA_FASE: "Oitavas",
  OITAVAS: "Quartas",
  QUARTAS: "Semi finais",
  SEMI_FINAIS: "Finais",
  FINAIS: null,
  FIM: null,
};

const COMPETITION_TO_TOURNAMENT: Record<CompetitionPhase, TournamentPhase> = {
  "Fase de grupos": "FASE_DE_GRUPOS",
  "Segunda fase": "SEGUNDA_FASE",
  Oitavas: "OITAVAS",
  Quartas: "QUARTAS",
  "Semi finais": "SEMI_FINAIS",
  Finais: "FINAIS",
};

export function getCurrentPhaseLabel(phase: TournamentPhase) {
  return TOURNAMENT_PHASE_LABELS[phase];
}

export function getEditableCompetitionPhase(phase: TournamentPhase) {
  return EDITABLE_PHASE_BY_PHASE[phase] ?? null;
}

export function normalizeCompetitionPhase(value: string) {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "fase de grupos":
      return "Fase de grupos";
    case "segunda fase":
      return "Segunda fase";
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
  now: number
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
  overridePhase?: TournamentPhase | null
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
  schedule: PhaseSchedule
) {
  const phaseMatches = getMatchesForCompetitionPhase(matches, editablePhase);
  const matchStarts = phaseMatches
    .map((match) => {
      if (!("fixture" in match)) {
        return null;
      }
      return match.fixture?.fixture?.date || null;
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
  phase: CompetitionPhase
) {
  return matches.filter((match) => normalizeCompetitionPhase(match.fase) === phase);
}
