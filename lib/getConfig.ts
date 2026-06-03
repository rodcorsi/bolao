import { supabase } from "./supabaseClient";
import type { CompetitionPhase, PhaseSchedule } from "./tournamentPhase";

export interface ScorePoints {
  EXACT: number;
  WINNER_AND_ONE_SCORE: number;
  WINNER: number;
  ONE_SCORE: number;
}

export interface PrizeBlock {
  poolPart: number;
  positions: number[];
}

export interface Prize {
  BONUS: number;
  GAME_VALUE: number;
  GENERAL: PrizeBlock;
  PHASES: Partial<Record<CompetitionPhase, PrizeBlock>>;
  FIRST_PLACE_PART?: number;
  SECOND_PLACE_PART?: number;
  THIRD_PLACE_PART?: number;
}

export interface RefreshTiming {
  MIN_REFRESH_SEC: number;
  MAX_REFRESH_SEC: number;
}

export interface Config {
  timeZone: string;
  locale: string;
  currency: string;
  scorePoints: ScorePoints;
  prize: Prize;
  refreshTiming: RefreshTiming;
  tournament: {
    title: string;
    season: number;
    rulesUrl: string;
  };
  phaseSchedule: PhaseSchedule;
}

const DEFAULT_CONFIG: Config = {
  timeZone: "America/Sao_Paulo",
  locale: "pt-BR",
  currency: "BRL",
  scorePoints: {
    EXACT: 12,
    WINNER_AND_ONE_SCORE: 7,
    WINNER: 5,
    ONE_SCORE: 2,
  },
  prize: {
    BONUS: 0,
    GAME_VALUE: 0,
    GENERAL: {
      poolPart: 0.5,
      positions: [0.6, 0.3, 0.1],
    },
    PHASES: {
      "Fase de grupos": {
        poolPart: 0.25,
        positions: [0.6, 0.3, 0.1],
      },
      Finais: {
        poolPart: 0.25,
        positions: [0.6, 0.3, 0.1],
      },
    },
  },
  refreshTiming: {
    MIN_REFRESH_SEC: 60,
    MAX_REFRESH_SEC: 900,
  },
  tournament: {
    title: "Bolão da Copa 2026",
    season: 2026,
    rulesUrl: "",
  },
  phaseSchedule: {
    INICIO: { startsAt: "" },
    FASE_DE_GRUPOS: { startsAt: "" },
    16_AVOS_FINAL: { startsAt: "" },
    OITAVAS: { startsAt: "" },
    QUARTAS: { startsAt: "" },
    SEMI_FINAIS: { startsAt: "" },
    FINAIS: { startsAt: "" },
    FIM: { startsAt: "" },
  },
};

function normalizePrizeBlock(
  value: Partial<PrizeBlock> | undefined,
  fallback: PrizeBlock
): PrizeBlock {
  return {
    poolPart:
      typeof value?.poolPart === "number" ? value.poolPart : fallback.poolPart,
    positions:
      Array.isArray(value?.positions) && value.positions.length > 0
        ? value.positions.filter((item): item is number => typeof item === "number")
        : fallback.positions,
  };
}

function normalizePrize(prize: Partial<Prize> | undefined): Prize {
  const fallback = DEFAULT_CONFIG.prize;
  return {
    BONUS: typeof prize?.BONUS === "number" ? prize.BONUS : fallback.BONUS,
    GAME_VALUE:
      typeof prize?.GAME_VALUE === "number" ? prize.GAME_VALUE : fallback.GAME_VALUE,
    GENERAL: normalizePrizeBlock(prize?.GENERAL, fallback.GENERAL),
    PHASES: {
      "Fase de grupos": normalizePrizeBlock(
        prize?.PHASES?.["Fase de grupos"],
        fallback.PHASES["Fase de grupos"] as PrizeBlock
      ),
      Finais: normalizePrizeBlock(
        prize?.PHASES?.Finais,
        fallback.PHASES.Finais as PrizeBlock
      ),
    },
    FIRST_PLACE_PART: prize?.FIRST_PLACE_PART,
    SECOND_PLACE_PART: prize?.SECOND_PLACE_PART,
    THIRD_PLACE_PART: prize?.THIRD_PLACE_PART,
  };
}

export async function getConfig(): Promise<Config> {
  const { data, error } = await supabase.from("config").select("*");
  if (error || !data || data.length === 0) {
    if (error) console.error("Error fetching config:", error.message);
    return DEFAULT_CONFIG;
  }
  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as Config;
  data.forEach((row: any) => {
    ((config as unknown) as Record<string, unknown>)[row.key] = row.value;
  });
  config.prize = normalizePrize(config.prize);
  return config;
}
