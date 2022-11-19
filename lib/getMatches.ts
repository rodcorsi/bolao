import matches from "../static_data/matches.json";

export interface Match {
  id: number;
  sequence: number;
  homeTeam: string;
  awayTeam: string;
  fase: string;
  fixtureID: number;
}

export default function getMatches() {
  return matches as Match[];
}

export function getMatchesMap() {
  return getMatches().reduce((acc, match) => {
    acc[match.id] = match;
    return acc;
  }, {} as { [id: number]: Match });
}

export function getMatchesByID(id: number) {
  return getMatches().find((match) => match.id === match.id);
}

export function getMatchesByFixtureID(fixtureID: number) {
  return getMatches().find((match) => match.fixtureID === match.fixtureID);
}
