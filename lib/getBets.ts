import { supabase } from "./supabaseClient";

export interface Bet {
  playerID: number;
  matchID: number;
  homeGoals: number;
  awayGoals: number;
}

export default async function getBets(): Promise<Bet[]> {
  const { data, error } = await supabase.from("bets").select("*");
  if (error) {
    console.error("Error fetching bets:", error.message);
    return [];
  }
  return data.map((b: any) => ({
    playerID: b.player_id,
    matchID: b.match_id,
    homeGoals: b.home_goals,
    awayGoals: b.away_goals,
  })) as Bet[];
}

export async function getBetsByPlayerID(playerID: number) {
  const { data, error } = await supabase
    .from("bets")
    .select("*")
    .eq("player_id", playerID);
  if (error) {
    console.error(`Error fetching bets for player ${playerID}:`, error.message);
    return [];
  }
  return data.map((b: any) => ({
    playerID: b.player_id,
    matchID: b.match_id,
    homeGoals: b.home_goals,
    awayGoals: b.away_goals,
  })) as Bet[];
}

export async function getBetsByPlayerIDAndMatchIDs(
  playerID: number,
  matchIDs: number[]
) {
  if (matchIDs.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from("bets")
    .select("*")
    .eq("player_id", playerID)
    .in("match_id", matchIDs);
  if (error) {
    console.error(
      `Error fetching bets for player ${playerID} and selected matches:`,
      error.message
    );
    return [];
  }
  return data.map((b: any) => ({
    playerID: b.player_id,
    matchID: b.match_id,
    homeGoals: b.home_goals,
    awayGoals: b.away_goals,
  })) as Bet[];
}
