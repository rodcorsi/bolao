import { Bet, getBetsByPlayerID } from "./getBets";
import {
  ResponseFixture,
  Status,
  getFootballFixtureMap,
} from "./getFootballFixture";
import getMatches, { Match } from "./getMatches";
import getPlayers, { Player } from "./getPlayers";

import cache from "memory-cache";
import calculatePoints from "./calculatePoints";

export interface Ranking {
  matches: MatchResult[];
  items: RankingItem[];
  updateTime: string;
}

export interface CountPoints {
  P12: number;
  P7: number;
  P5: number;
}

export interface RankingItem {
  position: number;
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

export default async function getRanking(): Promise<Ranking> {
  const cachedResponse = cache.get(CACHE_NAME);
  if (cachedResponse) {
    console.log("########### getRanking Cache");
    return cachedResponse;
  }
  console.log("########### getRanking Gerou");
  const data = await _getRanking();
  cache.put(CACHE_NAME, data, calculateCacheTimeout());
  return data;
}

function calculateCacheTimeout() {
  return 15 * MINUTE_IN_MS;
}

async function _getRanking(): Promise<Ranking> {
  const matches = await getMatchesResult();
  const players = getPlayers();
  const items = new Array<RankingItem>(players.length);
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    items[i] = rankingItem(player, matches);
  }
  sortRankingItems(items);
  return { matches, items, updateTime: new Date().toISOString() };
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
      points = calculatePoints(bet, match.fixture.score.fulltime);
    }
    bets[i] = { ...bet, points };
  }
  return {
    position: 0,
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
  return {
    P12: countPointsValue(bets, 12),
    P7: countPointsValue(bets, 7),
    P5: countPointsValue(bets, 5),
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
  if (a.countPoints.P12 !== b.countPoints.P12) {
    return b.countPoints.P12 - a.countPoints.P12;
  }
  if (a.countPoints.P7 !== b.countPoints.P7) {
    return b.countPoints.P7 - a.countPoints.P7;
  }
  if (a.countPoints.P5 !== b.countPoints.P5) {
    return b.countPoints.P5 - a.countPoints.P5;
  }
  return 0;
}

function isTieRankingItems(a: RankingItem, b: RankingItem) {
  if (a.points !== b.points) return false;
  if (a.countPoints.P12 !== b.countPoints.P12) return false;
  if (a.countPoints.P7 !== b.countPoints.P7) return false;
  if (a.countPoints.P5 !== b.countPoints.P5) return false;
  return true;
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
