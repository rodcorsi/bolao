import apiFootball from "./apiFootball";
import cache from "./cache";

const CACHE_NAME = "football";
const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const FOOTBALL_DATA_ORG_COMPETITION =
  process.env.FOOTBALL_DATA_ORG_COMPETITION || "WC";
const FOOTBALL_DATA_ORG_SEASON = process.env.FOOTBALL_DATA_ORG_SEASON || "2026";

export async function getFootballFixtureMap(options?: { dateFrom?: string }) {
  const fixture = await getFootballFixture(options);
  if (!fixture || !fixture.matches) return {};
  return fixture.matches.reduce(
    (acc, match) => {
      acc[match.id] = match;
      return acc;
    },
    {} as { [fixtureID: number]: FootballDataMatch },
  );
}

export default async function getFootballFixture(options?: {
  dateFrom?: string;
}): Promise<FootballMatchesResponse | null> {
  const cacheKey = `${CACHE_NAME}:${options?.dateFrom ?? "all"}`;
  const cachedResponse = cache.get(cacheKey);
  if (cachedResponse) {
    console.info("getFootballFixture using Cache");
    return cachedResponse;
  }
  try {
    if (!process.env.FOOTBAL_DATA_ORG_API_KEY) {
      console.warn("getFootballFixture: Missing API KEY");
      return cache.getLast(cacheKey);
    }
    const data = await fetchFootballFixture({ dateFrom: options?.dateFrom });
    return cache.put(cacheKey, data, MINUTE_IN_MS);
  } catch (error) {
    console.error("fetchFootballFixture error", error);
    return cache.getLast(cacheKey);
  }
}

export function fetchFootballFixture(params?: {
  dateFrom?: string;
  status?: string;
  stage?: string;
}) {
  console.info("fetchFootballFixture", params);
  const search = new URLSearchParams({ season: FOOTBALL_DATA_ORG_SEASON });
  if (params?.dateFrom) {
    // A football-data.org exige dateFrom e dateTo em conjunto; usamos um dateTo
    // bem à frente para cobrir todos os jogos restantes a partir de dateFrom.
    search.set("dateFrom", params.dateFrom);
    search.set("dateTo", addDays(params.dateFrom, 365));
  }
  if (params?.status) {
    search.set("status", params.status);
  }
  if (params?.stage) {
    search.set("stage", params.stage);
  }
  return apiFootball<FootballMatchesResponse>(
    `/competitions/${FOOTBALL_DATA_ORG_COMPETITION}/matches?${search.toString()}`,
  );
}

function addDays(date: string, days: number): string {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function selectGoals({ score }: FootballDataMatch): Goals {
  const regularTime = getGoals(score.regularTime);
  if (isGoalsFilled(regularTime)) return regularTime;

  const fullTime = getGoals(score.fullTime);
  if (isGoalsFilled(fullTime)) return fullTime;

  return getGoals(score.halfTime);
}

function getGoals(
  g: Goals | undefined | null | { home?: number | null; away?: number | null },
): Goals {
  if (!g) return { homeTeam: null, awayTeam: null };
  if ("homeTeam" in g) {
    return g;
  }
  if ("home" in g) {
    return {
      homeTeam: g.home ?? null,
      awayTeam: g.away ?? null,
    };
  }
  return { homeTeam: null, awayTeam: null };
}
function isGoalsFilled(g?: Goals): g is Goals {
  return g?.homeTeam != null && g.awayTeam != null;
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
