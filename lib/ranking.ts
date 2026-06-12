import { Bet, getBetsByPlayerID } from "./getBets";
import { Config, getConfig } from "./getConfig";
import {
  FootballDataMatch,
  getFootballFixtureMap,
  selectGoals,
} from "./getFootballFixture";
import connectCache, { getCacheResult, setCache } from "./connectCache";
import { countPoints, sortRankingItems, sumPoints } from "./rankingSummary";
import getMatches, { Match } from "./getMatches";
import getPlayers, { Player } from "./getPlayers";

import calculatePoints from "./calculatePoints";
import startOfDay from "./startOfDay";

export { bestRankingForMatches, rankingForMatches } from "./rankingSummary";

export interface Ranking {
  matches: MatchResult[];
  items: RankingItem[];
  updateTime: string;
  lastPosition: number;
  expire: number;
}

export interface CountPoints {
  exact: number;
  winnerAndOneScore: number;
  winner: number;
  oneScore: number;
}

export interface RankingItem {
  position: number;
  oldPosition: number;
  player: Player;
  points: number;
  countPoints: CountPoints;
  bets: BetResult[];
}

export interface BetResult extends Bet {
  points?: number | null;
}

export interface MatchResult extends Match {
  status: MatchStatus;
  fixture: FootballDataMatch;
}

export type MatchStatus = "FINISHED" | "IN_PLAY" | "NOT_STARTED";

const CACHE_NAME =
  process.env.NODE_ENV === "development" ? "ranking:dev" : "ranking";

export default async function getRanking(): Promise<Ranking> {
  await connectCache();
  const result = await getCacheResult<Ranking>(CACHE_NAME);
  const cacheResult = result.get();
  if (cacheResult != null) {
    console.info("getRanking Cache next update:", new Date(cacheResult.expire));
    return cacheResult;
  }
  try {
    console.info("getRanking");
    const ranking = await _getRanking();
    console.info("getRanking Saving cache");
    return await setCache(CACHE_NAME, ranking, ranking.expire);
  } catch (error) {
    console.info("getRanking error to get cache:", error);
    console.info("getRanking expired");
    const lastCache = result.getEvenExpired();
    if (lastCache != null) {
      return lastCache;
    }
    console.error("getRanking not expired cache");
    throw error;
  }
}

async function _getRanking(): Promise<Ranking> {
  const config = await getConfig();
  const matches = await getMatchesResult();
  const players = await getPlayers();
  const items = await createRankingItems(players, matches, config);
  return {
    matches,
    items,
    updateTime: new Date().toISOString(),
    lastPosition: items[items.length - 1]?.position || 0,
    expire: calculateCacheExpire(matches, config),
  };
}

export async function getMatchesResult() {
  const matches = await getMatches();
  const fixtureMap = await getFootballFixtureMap();
  const matchesResult = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const fixture = fixtureMap[match.fixtureID];
    if (!fixture) {
      console.warn(
        `Fixture not found for match ${match.id} (fixtureID: ${match.fixtureID})`,
      );
      continue;
    }
    matchesResult.push({
      ...match,
      status: calculateStatus(fixture),
      fixture,
    });
  }
  return matchesResult;
}

function calculateStatus(fixture: FootballDataMatch): MatchStatus {
  const status = fixture.status;
  switch (status) {
    case "FINISHED":
    case "AWARDED":
      return "FINISHED";
    case "SCHEDULED":
    case "TIMED":
    case "POSTPONED":
    case "SUSPENDED":
    case "CANCELLED":
      return "NOT_STARTED";
  }
  return "IN_PLAY";
}

function calculateCacheExpire(matches: MatchResult[], config: Config) {
  const MIN_REFRESH_IN_MS = config.refreshTiming.MIN_REFRESH_SEC * 1000;
  const MAX_REFRESH_IN_MS = config.refreshTiming.MAX_REFRESH_SEC * 1000;

  if (hasInPlayMatch(matches)) {
    return Date.now() + MIN_REFRESH_IN_MS;
  }
  const nextMatchInMs = whenIsNextMatchInMs(matches);
  if (nextMatchInMs > 0 && nextMatchInMs < MAX_REFRESH_IN_MS) {
    return Date.now() + Math.max(nextMatchInMs, MIN_REFRESH_IN_MS);
  }
  return Date.now() + MAX_REFRESH_IN_MS;
}

function hasInPlayMatch(matches: MatchResult[]) {
  return matches.find((match) => match.status === "IN_PLAY") != null;
}

function whenIsNextMatchInMs(matches: MatchResult[]) {
  const nowInMs = new Date().getTime();
  let nextMatch = Infinity;
  for (const match of matches) {
    const matchDateInMs = new Date(match.fixture.utcDate).getTime();
    if (matchDateInMs < nowInMs) {
      continue;
    }
    nextMatch = Math.min(nextMatch, matchDateInMs - nowInMs);
  }
  return nextMatch === Infinity ? -1 : nextMatch;
}

async function createRankingItems(
  players: Player[],
  matches: MatchResult[],
  config: Config,
) {
  const items = await Promise.all(
    players.map((player) => rankingItem(player, matches, config)),
  );
  sortRankingItems(items);
  const lastRanking = await calculateLastRanking(players, matches, config);
  assignOldPosition(items, lastRanking);
  return items;
}

async function rankingItem(
  player: Player,
  matches: MatchResult[],
  config: Config,
): Promise<RankingItem> {
  const playerBets = await getBetsByPlayerID(player.id);
  const betsByMatchID = playerBets.reduce(
    (acc, bet) => {
      acc[bet.matchID] = bet;
      return acc;
    },
    {} as { [matchID: number]: Bet },
  );
  const bets = new Array<BetResult>(matches.length);
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const bet = betsByMatchID[match.id];
    let points = null;
    if (
      match.status !== "NOT_STARTED" &&
      bet != null &&
      bet.homeGoals != null &&
      bet.awayGoals != null
    ) {
      points = calculatePoints(
        bet,
        selectGoals(match.fixture),
        config.scorePoints,
      );
    }
    bets[i] = {
      playerID: player.id,
      matchID: match.id,
      homeGoals: bet?.homeGoals ?? null,
      awayGoals: bet?.awayGoals ?? null,
      points,
    };
  }
  return {
    position: 0,
    oldPosition: 0,
    player,
    points: sumPoints(bets),
    countPoints: countPoints(bets, config.scorePoints),
    bets,
  };
}

async function calculateLastRanking(
  players: Player[],
  matches: MatchResult[],
  config: Config,
) {
  const startDay = startOfDay(Date.now(), config.timeZone);
  const matchUntilStartDay = matches.filter(
    ({ fixture }) => new Date(fixture.utcDate).getTime() < startDay,
  );
  const items = await Promise.all(
    players.map((player) => rankingItem(player, matchUntilStartDay, config)),
  );
  sortRankingItems(items);
  return items;
}

function assignOldPosition(items: RankingItem[], lastItems: RankingItem[]) {
  const mapLastRanking = lastItems.reduce(
    (acc, item) => {
      acc[item.player.id] = item.position;
      return acc;
    },
    {} as { [playerID: string]: number },
  );
  for (const item of items) {
    item.oldPosition = mapLastRanking[item.player.id];
  }
}

export function getMatchesOfDay(
  matches: MatchResult[],
  day: Date | number | string = Date.now(),
  timeZone = "America/Sao_Paulo",
) {
  const targetDay = startOfDay(day, timeZone);

  return matches.filter(
    (match) => startOfDay(match.fixture.utcDate, timeZone) === targetDay,
  );
}
