import apiFootball from "./apiFootball";
import cache from "./cache";

const CACHE_NAME = "football";
const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const FOOTBALL_DATA_ORG_COMPETITION =
  process.env.FOOTBALL_DATA_ORG_COMPETITION || "WC";
const FOOTBALL_DATA_ORG_SEASON = process.env.FOOTBALL_DATA_ORG_SEASON || "2026";

export async function getFootballFixtureMap() {
  const fixture = await getFootballFixture();
  if (!fixture || !fixture.matches) return {};
  return fixture.matches.reduce(
    (acc, match) => {
      acc[match.id] = match;
      return acc;
    },
    {} as { [fixtureID: number]: FootballDataMatch },
  );
}

export default async function getFootballFixture(): Promise<FootballMatchesResponse | null> {
  const cachedResponse = cache.get(CACHE_NAME);
  if (cachedResponse) {
    console.info("getFootballFixture using Cache");
    return cachedResponse;
  }
  try {
    if (!process.env.FOOTBAL_DATA_ORG_API_KEY) {
      console.warn("getFootballFixture: Missing API KEY");
      return cache.getLast(CACHE_NAME);
    }
    const data = await fetchFootballFixture();
    return cache.put(CACHE_NAME, data, MINUTE_IN_MS);
  } catch (error) {
    console.error("fetchFootballFixture error", error);
    return cache.getLast(CACHE_NAME);
  }
}

function fetchFootballFixture() {
  console.info("fetchFootballFixture");
  return apiFootball<FootballMatchesResponse>(
    `/competitions/${FOOTBALL_DATA_ORG_COMPETITION}/matches?season=${FOOTBALL_DATA_ORG_SEASON}`,
  );
}

export function selectGoals(match: FootballDataMatch) {
  if (
    match.score.regularTime?.homeTeam != null &&
    match.score.regularTime?.awayTeam != null
  ) {
    return match.score.regularTime;
  }
  if (
    match.score.fullTime.homeTeam != null &&
    match.score.fullTime.awayTeam != null
  ) {
    return match.score.fullTime;
  }
  return match.score.halfTime;
}

// https://docs.football-data.org/general/v4
export interface Goals {
  homeTeam: number | null;
  awayTeam: number | null;
}

export interface FootballDataArea {
  id: number;
  name: string;
  code?: string;
  flag?: string;
}

export interface FootballDataCompetition {
  id: number;
  name: string;
  code: string;
}

export interface FootballDataSeason {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday?: number | null;
}

export interface FootballDataTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string | null;
}

export interface FootballDataScore {
  winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration?: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
  fullTime: Goals;
  regularTime?: Goals;
  halfTime: Goals;
  extraTime?: Goals;
  penalties?: Goals;
}

export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status:
    | "SCHEDULED"
    | "TIMED"
    | "IN_PLAY"
    | "PAUSED"
    | "EXTRA_TIME"
    | "PENALTY_SHOOTOUT"
    | "FINISHED"
    | "SUSPENDED"
    | "POSTPONED"
    | "CANCELLED"
    | "AWARDED";
  matchday?: number | null;
  stage?: string | null;
  group?: string | null;
  area?: FootballDataArea;
  competition?: FootballDataCompetition;
  season?: FootballDataSeason;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score: FootballDataScore;
}

export interface FootballMatchesResponse {
  filters?: {
    season?: string;
  };
  resultSet?: {
    count?: number;
    first?: string;
    last?: string;
    played?: number;
  };
  competition?: FootballDataCompetition;
  matches: FootballDataMatch[];
}
