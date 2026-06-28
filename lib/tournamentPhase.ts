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
  playingPhase: TournamentPhase;
  playingPhaseLabel: string;
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

export function isMatchVisibleForPhase(
  match: { fase: string },
  currentPhase: TournamentPhase,
): boolean {
  const phase = normalizeCompetitionPhase(match.fase);
  return (
    phase != null && getVisibleCompetitionPhases(currentPhase).includes(phase)
  );
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

/**
 * Fase "em jogo": avança automaticamente quando a última partida da fase atual
 * termina (estimado em +3h após o início do último jogo). Diferente de
 * `resolveCurrentPhaseBySchedule` (que é guiada pelas datas do config e governa
 * a janela/prazo de palpites), esta reflete o que está sendo disputado e serve
 * apenas para o rótulo "Fase atual" exibido.
 */
export function resolvePlayingPhase(
  schedule: PhaseSchedule,
  matches: Array<Match | MatchResult>,
  nowInput: number | string | Date = Date.now(),
  overridePhase?: TournamentPhase | null,
): TournamentPhase {
  if (overridePhase && TOURNAMENT_PHASES.includes(overridePhase)) {
    return overridePhase;
  }
  const now = new Date(nowInput).getTime();
  const groupStart = parseDate(schedule.FASE_DE_GRUPOS?.startsAt);
  if (groupStart == null || now < groupStart) {
    return "INICIO";
  }
  let current: TournamentPhase = "FASE_DE_GRUPOS";
  while (true) {
    const competition = normalizeCompetitionPhase(getCurrentPhaseLabel(current));
    if (!competition) {
      break;
    }
    const lastMatch = getLastMatchDate(matches, competition);
    if (!lastMatch) {
      break;
    }
    if (now < new Date(lastMatch).getTime() + LAST_MATCH_BUFFER_MS) {
      break;
    }
    const next: TournamentPhase | undefined =
      TOURNAMENT_PHASES[TOURNAMENT_PHASES.indexOf(current) + 1];
    if (!next) {
      break;
    }
    current = next;
    if (current === "FIM") {
      break;
    }
  }
  return current;
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
  const playingPhase = resolvePlayingPhase(schedule, matches, now, overridePhase);
  const candidateEditablePhase = getEditableCompetitionPhase(currentPhase);
  const editablePhase =
    candidateEditablePhase &&
    getMatchesForCompetitionPhase(matches, candidateEditablePhase).length > 0
      ? candidateEditablePhase
      : null;
  const phaseStartAt = schedule[currentPhase]?.startsAt || null;
  const editablePhaseLockAt = editablePhase
    ? getPhaseLockAt(editablePhase, matches, schedule)
    : null;
  return {
    currentPhase,
    currentPhaseLabel: getCurrentPhaseLabel(currentPhase),
    playingPhase,
    playingPhaseLabel: getCurrentPhaseLabel(playingPhase),
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
  const targetPhase = COMPETITION_TO_TOURNAMENT[editablePhase];
  const scheduledLockAt = schedule[targetPhase]?.startsAt || null;
  if (scheduledLockAt) {
    return scheduledLockAt;
  }
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
  return matchStarts[0] ?? null;
}

export function getMatchesForCompetitionPhase<T extends Match | MatchResult>(
  matches: T[],
  phase: CompetitionPhase,
) {
  return matches.filter(
    (match) => normalizeCompetitionPhase(match.fase) === phase,
  );
}

export interface NextPhaseNotice {
  phaseLabel: CompetitionPhase;
  opensAt: string;
  closesAt: string;
}

const NOTICE_LEAD_DAYS = 3;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
// Margem após o início da última partida da fase atual para garantir que ela já
// foi finalizada antes de liberar os palpites da próxima fase.
const LAST_MATCH_BUFFER_MS = 3 * 60 * 60 * 1000;

/**
 * Aviso antecipado da próxima fase: informa quando os palpites da fase seguinte
 * ficarão disponíveis (última partida da fase atual) e quando fecharão (início
 * da próxima fase no schedule). Só retorna dados na janela de 3 dias antes da
 * abertura; fora dela, ou sem próxima fase, retorna null.
 */
export function resolveNextPhaseNotice(
  currentPhase: TournamentPhase,
  schedule: PhaseSchedule,
  matches: Array<Match | MatchResult>,
  nowInput: number | string | Date = Date.now(),
): NextPhaseNotice | null {
  const nextPhase = getEditableCompetitionPhase(currentPhase);
  if (!nextPhase) {
    return null;
  }
  const currentCompetition = normalizeCompetitionPhase(
    getCurrentPhaseLabel(currentPhase),
  );
  if (!currentCompetition) {
    return null;
  }
  const lastMatchAt = getLastMatchDate(matches, currentCompetition);
  if (!lastMatchAt) {
    return null;
  }
  // Última partida + 3h: assim a partida certamente já terminou.
  const opensMs = new Date(lastMatchAt).getTime() + LAST_MATCH_BUFFER_MS;
  const opensAt = new Date(opensMs).toISOString();
  const now = new Date(nowInput).getTime();
  if (now >= opensMs || opensMs - now > NOTICE_LEAD_DAYS * DAY_IN_MS) {
    return null;
  }
  const closesAt = getPhaseLockAt(nextPhase, matches, schedule);
  if (!closesAt) {
    return null;
  }
  return { phaseLabel: nextPhase, opensAt, closesAt };
}

function getLastMatchDate(
  matches: Array<Match | MatchResult>,
  phase: CompetitionPhase,
) {
  const matchStarts = getMatchesForCompetitionPhase(matches, phase)
    .map((match) => {
      if (!("fixture" in match)) {
        return null;
      }
      return match.fixture?.utcDate || null;
    })
    .filter((value): value is string => value != null)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return matchStarts[0] ?? null;
}
