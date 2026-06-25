import { supabase } from "./supabaseClient";

export interface Bet {
  playerID: number;
  matchID: number;
  homeGoals: number | null;
  awayGoals: number | null;
}

export interface BetWithID extends Bet {
  id: number;
}

export async function getBetsRawByMatchIDs(
  matchIDs: number[]
): Promise<BetWithID[]> {
  if (matchIDs.length === 0) {
    return [];
  }
  const PAGE_SIZE = 1000;
  const all: BetWithID[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("bets")
      .select("id, player_id, match_id, home_goals, away_goals")
      .in("match_id", matchIDs)
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error("Error fetching bets for selected matches:", error.message);
      return all;
    }
    all.push(
      ...data.map((b: any) => ({
        id: b.id,
        playerID: b.player_id,
        matchID: b.match_id,
        homeGoals: b.home_goals,
        awayGoals: b.away_goals,
      }))
    );
    if (data.length < PAGE_SIZE) {
      break;
    }
  }
  return all;
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
