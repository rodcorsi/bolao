import { supabase } from "./supabaseClient";
import type { PhaseSchedule } from "./tournamentPhase";

export interface ScorePoints {
  EXACT: number;
  WINNER_AND_ONE_SCORE: number;
  WINNER: number;
  ONE_SCORE: number;
}

export interface Prize {
  BONUS: number;
  GAME_VALUE: number;
  FIRST_PLACE_PART: number;
  SECOND_PLACE_PART: number;
  THIRD_PLACE_PART: number;
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
    FIRST_PLACE_PART: 0.5,
    SECOND_PLACE_PART: 0.3,
    THIRD_PLACE_PART: 0.2,
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
    SEGUNDA_FASE: { startsAt: "" },
    OITAVAS: { startsAt: "" },
    QUARTAS: { startsAt: "" },
    SEMI_FINAIS: { startsAt: "" },
    FINAIS: { startsAt: "" },
    FIM: { startsAt: "" },
  },
};

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
  return config;
}
