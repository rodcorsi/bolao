import apiFootball from "./apiFootball";
import cache from "./cache";

const CACHE_NAME = "football";
const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;

export async function getFootballFixtureMap() {
  const fixture = await getFootballFixture();
  return fixture.response.reduce((acc, response) => {
    acc[response.fixture.id] = response;
    return acc;
  }, {} as { [fixtureID: number]: ResponseFixture });
}

export default async function getFootballFixture(): Promise<FootballFixture> {
  const cachedResponse = cache.get(CACHE_NAME);
  if (cachedResponse) {
    console.info("getFootballFixture using Cache");
    return cachedResponse;
  }
  try {
    const data = await fetchFootballFixture();
    return cache.put(CACHE_NAME, data, MINUTE_IN_MS);
  } catch (error) {
    console.info("fetchFootballFixture error to get cache", error);
    console.info("getFootballFixture get expired");
    const lastCache = cache.getLast(CACHE_NAME);
    if (lastCache) {
      return lastCache;
    }
    console.error("getFootballFixture not expired cache");
    throw error;
  }
}

function fetchFootballFixture() {
  console.info("fetchFootballFixture");
  return apiFootball("/fixtures?league=1&season=2022");
}

export function selectGoals(fixture: ResponseFixture) {
  if (fixture.score.fulltime.home == null) {
    return fixture.goals;
  }
  return fixture.score.fulltime;
}

export interface Parameters {
  league: string;
  season: string;
}

export interface Paging {
  current: number;
  total: number;
}

export interface Periods {
  first?: any;
  second?: any;
}

export interface Venue {
  id?: any;
  name: string;
  city: string;
}

export interface Status {
  long: string;
  short: string;
  elapsed?: any;
}

export interface Fixture {
  id: number;
  referee?: any;
  timezone: string;
  date: string;
  timestamp: number;
  periods: Periods;
  venue: Venue;
  status: Status;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag?: any;
  season: number;
  round: string;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: any;
}

export interface Teams {
  home: Team;
  away: Team;
}

export interface Goals {
  home?: number;
  away?: number;
}

export interface Score {
  halftime: Goals;
  fulltime: Goals;
  extratime: Goals;
  penalty: Goals;
}

export interface ResponseFixture {
  fixture: Fixture;
  league: League;
  teams: Teams;
  goals: Goals;
  score: Score;
}

export interface FootballFixture {
  get: string;
  parameters: Parameters;
  errors: any[];
  results: number;
  paging: Paging;
  response: ResponseFixture[];
}
