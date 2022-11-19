import { Bet, getBetsByPlayerID } from "./getBets";
import {
  MatchStatus,
  ResponseFixture,
  getFootballFixtureMap,
  matchStatus,
} from "./getFootballFixture";
import getMatches, { Match, getMatchesMap } from "./getMatches";
import getPlayers, { Player } from "./getPlayers";

import calculatePoints from "./calculatePoints";
import deepEqual from "deep-equal";

export interface Ranking {
  matches: MatchResult[];
  items: RankingItem[];
}

export interface RankingItem {
  position: number;
  player: Player;
  points: number;
  countPoints: {
    [point: number]: number;
  };
  bets: BetResult[];
}

export interface BetResult extends Bet {
  points?: number | null;
}

export interface MatchResult extends Match {
  status: MatchStatus;
  fixture: ResponseFixture;
}

export default async function getRanking(): Promise<Ranking> {
  const matches = await getMatchesResult();
  const players = getPlayers();
  const items = new Array<RankingItem>(players.length);
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    items[i] = rankingItem(player, matches);
  }
  sortRankingItems(items);
  return { matches, items };
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
  matchesResult.sort((a, b) =>
    a.fixture.fixture.date.localeCompare(b.fixture.fixture.date)
  );
  for (let i = 0; i < matchesResult.length; i++) {
    matchesResult[i].sequence = i;
  }
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
      points = calculatePoints(bet, match.fixture.goals);
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

function countPoints(bets: BetResult[]) {
  let count: { [point: number]: number } = {};
  for (const bet of bets) {
    if (bet.points == null || bet.points === 0) continue;
    if (count[bet.points]) {
      count[bet.points] = count[bet.points] + 1;
    } else {
      count[bet.points] = 1;
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
  for (const point of getAllPoints(a, b)) {
    if (a.countPoints[point] !== b.countPoints[point]) {
      const aCount = a.countPoints[point] || 0;
      const bCount = b.countPoints[point] || 0;
      return bCount - aCount;
    }
  }
  return 0;
}

function getAllPoints(a: RankingItem, b: RankingItem) {
  return Array.from(
    new Set(Object.keys(a.countPoints).concat(Object.keys(b.countPoints)))
  )
    .map((a) => parseInt(a))
    .sort((a, b) => b - a);
}

function isTieRankingItems(a: RankingItem, b: RankingItem) {
  if (a.points !== b.points) return false;
  return deepEqual(a.countPoints, b.countPoints);
}
