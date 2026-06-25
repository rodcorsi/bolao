import { FootballDataMatch } from "./getFootballFixture";
import { supabase } from "./supabaseClient";

export interface MatchResultRow {
  homeGoals: number;
  awayGoals: number;
  kickoffAt: string;
  fixture: FootballDataMatch;
}

export async function getMatchResultsMap(): Promise<{
  [matchID: number]: MatchResultRow;
}> {
  const { data, error } = await supabase.from("match_results").select("*");
  if (error) {
    console.error("Error fetching match_results:", error.message);
    return {};
  }
  return data.reduce(
    (acc: { [matchID: number]: MatchResultRow }, row: any) => {
      acc[row.match_id] = {
        homeGoals: row.home_goals,
        awayGoals: row.away_goals,
        kickoffAt: row.kickoff_at,
        fixture: row.fixture as FootballDataMatch,
      };
      return acc;
    },
    {} as { [matchID: number]: MatchResultRow },
  );
}
