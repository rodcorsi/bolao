import { supabase } from "./supabaseClient";

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
}

export async function getConfig(): Promise<Config> {
  const { data, error } = await supabase.from('config').select('*');
  if (error || !data || data.length === 0) {
    if (error) console.error('Error fetching config:', error.message);
    throw new Error('Could not fetch configuration from Supabase');
  }
  const config: any = {};
  data.forEach((row: any) => {
    config[row.key] = row.value;
  });
  return config as Config;
}
