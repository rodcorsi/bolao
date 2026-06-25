import { Config } from "./getConfig";
import { MatchResult } from "./ranking";
import {
  TOURNAMENT_PHASES,
  NextPhaseNotice,
  PhaseState,
  TournamentPhase,
  resolveNextPhaseNotice,
  resolvePhaseState,
} from "./tournamentPhase";

function getOverridePhase() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  const override = process.env.APP_PHASE_OVERRIDE as TournamentPhase | undefined;
  if (override && TOURNAMENT_PHASES.includes(override)) {
    return override;
  }
  return null;
}

function getNowInput() {
  if (process.env.NODE_ENV !== "development" || !process.env.APP_PHASE_NOW) {
    return Date.now();
  }
  return process.env.APP_PHASE_NOW;
}

export function getPhaseState(config: Config, matches: MatchResult[]): PhaseState {
  return resolvePhaseState(
    config.phaseSchedule,
    matches,
    getNowInput(),
    getOverridePhase()
  );
}

export function getNextPhaseNotice(
  config: Config,
  phaseState: PhaseState,
  matches: MatchResult[]
): NextPhaseNotice | null {
  return resolveNextPhaseNotice(
    phaseState.currentPhase,
    config.phaseSchedule,
    matches,
    getNowInput()
  );
}
