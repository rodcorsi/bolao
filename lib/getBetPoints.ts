import { supabase } from "./supabaseClient";

export function betPointsKey(playerID: number, matchID: number) {
  return `${playerID}:${matchID}`;
}

export async function getBetPointsMap(): Promise<{ [key: string]: number }> {
  const PAGE_SIZE = 1000;
  const map: { [key: string]: number } = {};
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("bet_points")
      .select("points, bets(player_id, match_id)")
      .order("bet_id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error("Error fetching bet_points:", error.message);
      return map;
    }
    for (const row of data as any[]) {
      const bet = Array.isArray(row.bets) ? row.bets[0] : row.bets;
      if (bet != null) {
        map[betPointsKey(bet.player_id, bet.match_id)] = row.points;
      }
    }
    if (data.length < PAGE_SIZE) {
      break;
    }
  }
  return map;
}
