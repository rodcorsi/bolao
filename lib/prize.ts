import {
  COMPETITION_PHASE_LABELS,
  CompetitionPhase,
  getMatchesForCompetitionPhase,
} from "./tournamentPhase";
import { Config, PrizeBlock } from "./getConfig";
import type { MatchResult, RankingItem } from "./ranking";
import { rankingForMatches } from "./rankingSummary";

export interface PrizeWinner {
  amount: number;
  items: RankingItem[];
  position: number;
}

export interface PrizeBlockSummary {
  key: string;
  label: string;
  poolAmount: number;
  poolPart: number;
  positions: number[];
  winners: PrizeWinner[];
}

export interface PrizeSummary {
  general: PrizeBlockSummary;
  phases: PrizeBlockSummary[];
  totalPool: number;
}

interface PrizePhaseGroup {
  key: CompetitionPhase;
  label: string;
  phases: CompetitionPhase[];
}

const PHASE_PRIZE_GROUPS: PrizePhaseGroup[] = [
  {
    key: "Fase de grupos",
    label: "Fase de grupos",
    phases: ["Fase de grupos"],
  },
  {
    key: "Finais",
    label: "Finais",
    phases: ["Segunda fase", "Oitavas", "Quartas", "Semi finais", "Finais"],
  },
];

export function calculateTotalPrizePool(playerCount: number, config: Config) {
  return playerCount * config.prize.GAME_VALUE + config.prize.BONUS;
}

export function buildPrizeSummary(input: {
  config: Config;
  matches: MatchResult[];
  rankingItems: RankingItem[];
}): PrizeSummary {
  const totalPool = calculateTotalPrizePool(input.rankingItems.length, input.config);
  const general = buildPrizeBlockSummary({
    key: "general",
    label: "Prêmio geral",
    block: input.config.prize.GENERAL,
    poolBase: totalPool,
    rankingItems: input.rankingItems,
  });
  const phases = PHASE_PRIZE_GROUPS.flatMap((group) => {
    const block = input.config.prize.PHASES[group.key];
    if (!block) {
      return [];
    }
    const phaseMatches = group.phases.flatMap((phase) =>
      getMatchesForCompetitionPhase(input.matches, phase)
    );
    if (phaseMatches.length === 0) {
      return [];
    }
    const phaseRanking = rankingForMatches(
      phaseMatches,
      input.rankingItems,
      input.config.scorePoints
    );
    return [
      buildPrizeBlockSummary({
        key: group.key,
        label: group.label,
        block,
        poolBase: totalPool,
        rankingItems: phaseRanking,
      }),
    ];
  });
  return {
    totalPool,
    general,
    phases,
  };
}

function buildPrizeBlockSummary(input: {
  key: string;
  label: string;
  block: PrizeBlock;
  poolBase: number;
  rankingItems: RankingItem[];
}): PrizeBlockSummary {
  const poolAmount = input.poolBase * input.block.poolPart;
  const winners = input.block.positions.map((positionPart, index) => {
    const position = index + 1;
    const tiedItems = input.rankingItems.filter(
      (item) => item.points > 0 && item.position === position
    );
    const baseAmount = poolAmount * positionPart;
    return {
      position,
      items: tiedItems,
      amount: tiedItems.length > 0 ? baseAmount / tiedItems.length : baseAmount,
    };
  });
  return {
    key: input.key,
    label: input.label,
    poolAmount,
    poolPart: input.block.poolPart,
    positions: input.block.positions,
    winners,
  };
}

export function getTopPrize(block: PrizeBlockSummary) {
  return block.winners[0] ?? null;
}

export function getPrizePhaseLabels() {
  return PHASE_PRIZE_GROUPS.map((group) => group.key).filter((phase) =>
    COMPETITION_PHASE_LABELS.includes(phase)
  );
}
