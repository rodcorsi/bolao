import { supabase } from "./supabaseClient";

export interface Match {
  id: number;
  sequence: number;
  homeTeam: string;
  awayTeam: string;
  fase: string;
  fixtureID: number;
  group: string;
}

export default async function getMatches(): Promise<Match[]> {
  const { data, error } = await supabase.from('matches').select('*').order('sequence');
  if (error) {
    console.error('Error fetching matches:', error.message);
    return [];
  }
  return data.map((m: any) => ({
    id: m.id,
    sequence: m.sequence,
    homeTeam: m.home_team,
    awayTeam: m.away_team,
    fase: m.fase,
    fixtureID: m.fixture_id,
    group: m.group_name
  })) as Match[];
}

export async function getMatchesMap() {
  const matches = await getMatches();
  return matches.reduce((acc, match) => {
    acc[match.id] = match;
    return acc;
  }, {} as { [id: number]: Match });
}

export async function getMatchesByID(id: number) {
  const matches = await getMatches();
  return matches.find((match) => match.id === id);
}

export async function getMatchesByFixtureID(fixtureID: number) {
  const matches = await getMatches();
  return matches.find((match) => match.fixtureID === fixtureID);
}
