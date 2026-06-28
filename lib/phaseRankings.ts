import {
  COMPETITION_PHASE_LABELS,
  CompetitionPhase,
  getMatchesForCompetitionPhase,
} from "./tournamentPhase";
import type { MatchResult, RankingItem } from "./ranking";

import type { ScorePoints } from "./getConfig";
import { rankingForMatches } from "./rankingSummary";

export interface PhaseRanking {
  key: "geral" | "grupos" | "finais";
  label: string;
  items: RankingItem[];
  lastPosition: number;
  hasMatches: boolean;
}

const KNOCKOUT_PHASES: CompetitionPhase[] = COMPETITION_PHASE_LABELS.filter(
  (phase) => phase !== "Fase de grupos",
);

export function buildPhaseRankings(
  matches: MatchResult[],
  generalItems: RankingItem[],
  scorePoints: ScorePoints,
): PhaseRanking[] {
  const groupMatches = getMatchesForCompetitionPhase(matches, "Fase de grupos");
  const finalMatches = KNOCKOUT_PHASES.flatMap((phase) =>
    getMatchesForCompetitionPhase(matches, phase),
  );
  const grupos = withoutPositionChange(
    rankingForMatches(groupMatches, generalItems, scorePoints),
  );
  const finais = withoutPositionChange(
    rankingForMatches(finalMatches, generalItems, scorePoints),
  );
  return [
    {
      key: "geral",
      label: "Geral",
      items: generalItems,
      lastPosition: lastPositionOf(generalItems),
      hasMatches: matches.length > 0,
    },
    {
      key: "finais",
      label: "Finais",
      items: finais,
      lastPosition: lastPositionOf(finais),
      hasMatches: finalMatches.length > 0,
    },
    {
      key: "grupos",
      label: "Fase de grupos",
      items: grupos,
      lastPosition: lastPositionOf(grupos),
      hasMatches: groupMatches.length > 0,
    },
  ];
}

// As etapas reaproveitam o oldPosition do ranking geral, o que mostraria setas
// de variação enganosas; neutralizamos igualando oldPosition à posição atual.
function withoutPositionChange(items: RankingItem[]): RankingItem[] {
  return items.map((item) => ({ ...item, oldPosition: item.position }));
}

function lastPositionOf(items: RankingItem[]) {
  return items[items.length - 1]?.position || 0;
}
