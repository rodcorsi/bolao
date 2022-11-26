import { Bet, getBetsByPlayerID } from "./getBets";
import {
  ResponseFixture,
  Status,
  getFootballFixtureMap,
  selectGoals,
} from "./getFootballFixture";
import connectCache, { getCacheResult, setCache } from "./connectCache";
import getMatches, { Match } from "./getMatches";
import getPlayers, { Player } from "./getPlayers";

import calculatePoints from "./calculatePoints";
import config from "../static_data/config.json";

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
  fixture: ResponseFixture;
}

const CACHE_NAME = "ranking";
const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const HOURS_IN_MS = 60 * MINUTE_IN_MS;
const MIN_REFRESH_IN_MS = 10 * MINUTE_IN_MS;
const MAX_REFRESH_IN_MS = 12 * HOURS_IN_MS;

export default async function getRanking(): Promise<Ranking> {
  await connectCache();
  const result = await getCacheResult<Ranking>(CACHE_NAME);
  const cacheResult = result.get();
  if (cacheResult != null) {
    console.log("########### getRanking Cache");
    return cacheResult;
  }
  try {
    console.log("########### getRanking Gerou");
    const ranking = await _getRanking();
    console.log("########### getRanking Salva");
    return await setCache(CACHE_NAME, ranking, ranking.expire);
  } catch (error) {
    console.log("########### getRanking get expired");
    const lastCache = result.getEvenExpired();
    if (lastCache != null) {
      return lastCache;
    }
    throw error;
  }
}

async function _getRanking(): Promise<Ranking> {
  const matches = await getMatchesResult();
  const players = getPlayers();
  const items = createRankingItems(players, matches);
  return {
    matches,
    items,
    updateTime: new Date().toISOString(),
    lastPosition: items[items.length - 1]?.position || 0,
    expire: calculateCacheExpire(matches),
  };
}

async function getMatchesResult() {
  const matches = getMatches();
  const fixtureMap = await getFootballFixtureMap();
  const matchesResult = new Array<MatchResult>(matches.length);
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const fixture = fixtureMap[match.fixtureID];
    const status = matchStatus(fixture.fixture.status);
    matchesResult[i] = { ...match, status, fixture };
  }
  matchesResult.sort((a, b) => a.sequence - b.sequence);
  return matchesResult;
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

function calculateCacheExpire(matches: MatchResult[]) {
  if (hasInPlayMatch(matches)) {
    return Date.now() + MIN_REFRESH_IN_MS;
  }
  let nextMatch = whenIsNextMatchInMs(matches);
  if (nextMatch > 0) {
    return Date.now() + nextMatch + MIN_REFRESH_IN_MS;
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
    const matchDateInMs = new Date(match.fixture.fixture.date).getTime();
    if (matchDateInMs < nowInMs) {
      continue;
    }
    nextMatch = Math.min(nextMatch, matchDateInMs - nowInMs);
  }
  return nextMatch === Infinity ? -1 : nextMatch;
}

function createRankingItems(players: Player[], matches: MatchResult[]) {
  const items = players.map((player) => rankingItem(player, matches));
  sortRankingItems(items);
  assignOldPosition(items, calculateLastRanking(players, matches));
  return items;
}

function rankingItem(player: Player, matches: MatchResult[]): RankingItem {
  const betsByMatchID = getBetsByPlayerID(player.id).reduce((acc, bet) => {
    acc[bet.matchID] = bet;
    return acc;
  }, {} as { [matchID: number]: Bet });
  const bets = new Array<BetResult>(matches.length);
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const bet = betsByMatchID[match.id];
    let points = null;
    if (match.status !== "NOT_STARTED") {
      points = calculatePoints(bet, selectGoals(match.fixture));
    }
    bets[i] = { ...bet, points };
  }
  return {
    position: 0,
    oldPosition: 0,
    player,
    points: sumPoints(bets),
    countPoints: countPoints(bets),
    bets,
  };
}

function sumPoints(bets: BetResult[]) {
  let points = 0;
  for (const bet of bets) {
    if (bet.points != null) {
      points += bet.points;
    }
  }
  return points;
}

function countPoints(bets: BetResult[]): CountPoints {
  const { scorePoints } = config;
  return {
    exact: countPointsValue(bets, scorePoints.EXACT),
    winnerAndOneScore: countPointsValue(bets, scorePoints.WINNER_AND_ONE_SCORE),
    winner: countPointsValue(bets, scorePoints.WINNER),
    oneScore: countPointsValue(bets, scorePoints.ONE_SCORE),
  };
}

function countPointsValue(bets: BetResult[], value: number) {
  let count = 0;
  for (const bet of bets) {
    if (bet.points === value) {
      count++;
    }
  }
  return count;
}

function sortRankingItems(items: RankingItem[]) {
  items.sort(sortByPoints);
  let position = 1;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i > 0 && !isTieRankingItems(item, items[i - 1])) {
      position++;
    }
    item.position = position;
  }
}

function sortByPoints(a: RankingItem, b: RankingItem) {
  if (a.points !== b.points) {
    return b.points - a.points;
  }
  if (a.countPoints.exact !== b.countPoints.exact) {
    return b.countPoints.exact - a.countPoints.exact;
  }
  if (a.countPoints.winnerAndOneScore !== b.countPoints.winnerAndOneScore) {
    return b.countPoints.winnerAndOneScore - a.countPoints.winnerAndOneScore;
  }
  if (a.countPoints.winner !== b.countPoints.winner) {
    return b.countPoints.winner - a.countPoints.winner;
  }
  return 0;
}

function isTieRankingItems(a: RankingItem, b: RankingItem) {
  if (a.points !== b.points) return false;
  if (a.countPoints.exact !== b.countPoints.exact) return false;
  if (a.countPoints.winnerAndOneScore !== b.countPoints.winnerAndOneScore)
    return false;
  if (a.countPoints.winner !== b.countPoints.winner) return false;
  return true;
}

function calculateLastRanking(players: Player[], matches: MatchResult[]) {
  const startDay = brazilStartDay().getTime();
  const matchUntilStartDay = matches.filter(
    ({ fixture }) => new Date(fixture.fixture.date).getTime() < startDay
  );
  const items = players.map((player) =>
    rankingItem(player, matchUntilStartDay)
  );
  sortRankingItems(items);
  return items;
}

function brazilStartDay() {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate(), 3));
}

function assignOldPosition(items: RankingItem[], lastItems: RankingItem[]) {
  const mapLastRanking = lastItems.reduce((acc, item) => {
    acc[item.player.id] = item.position;
    return acc;
  }, {} as { [playerID: string]: number });
  for (const item of items) {
    item.oldPosition = mapLastRanking[item.player.id];
  }
}
