import apiFootball from "./apiFootball";
import cache from "memory-cache";

const CACHE_NAME = "football";
const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;

export default async function getFootballFixture(): Promise<FootballFixture> {
  const cachedResponse = cache.get(CACHE_NAME);
  if (cachedResponse) {
    console.log("########### getFootballFixture Cache");
    return cachedResponse;
  }
  console.log("########### getFootballFixture Gerou");
  const data = await fetchFootballFixture();
  cache.put(CACHE_NAME, data, calculateCacheTimeout());
  return data;
}

function calculateCacheTimeout() {
  return 15 * MINUTE_IN_MS;
}

function fetchFootballFixture() {
  if (process.env.NODE_ENV === "production") {
    return apiFootball("/fixtures?league=1&season=2022");
  }
  console.log("########### fetchFootballFixture static json");
  return require("../static_data/football_fixture.json");
}

export async function getFootballFixtureMap() {
  const fixture = await getFootballFixture();
  return fixture.response.reduce((acc, response) => {
    acc[response.fixture.id] = response;
    return acc;
  }, {} as { [fixtureID: number]: ResponseFixture });
}

export type MatchStatus = "NOT_STARTED" | "IN_PLAY" | "FINISHED";

const matchStatusByFixture: { [status: string]: MatchStatus } = {
  TBD: "NOT_STARTED",
  NS: "NOT_STARTED",
  "1H": "IN_PLAY",
  HT: "IN_PLAY",
  "2H": "IN_PLAY",
  ET: "IN_PLAY",
  BT: "IN_PLAY",
  P: "IN_PLAY",
  SUSP: "IN_PLAY",
  INT: "IN_PLAY",
  FT: "FINISHED",
  AET: "FINISHED",
  PEN: "FINISHED",
  PST: "NOT_STARTED",
  CANC: "NOT_STARTED",
  ABD: "NOT_STARTED",
  AWD: "NOT_STARTED",
  WO: "NOT_STARTED",
  LIVE: "IN_PLAY",
};

export function matchStatus(status: Status) {
  return matchStatusByFixture[status.short];
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
