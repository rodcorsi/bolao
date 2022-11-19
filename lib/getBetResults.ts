import { Bet, getBetsByPlayerID } from "./getBets";
import { Match, getMatchesMap } from "./getMatches";
import {
  MatchStatus,
  getFootballFixtureMap,
  matchStatus,
} from "./getFootballFixture";

import calculatePoints from "./calculatePoints";

export interface BetResult extends Bet {
  match: Match;
  status: MatchStatus;
  points?: number | null;
}

export async function getBetsResultByPlayer(playerID: number) {
  const bets = getBetsByPlayerID(playerID);
  const matchesMap = getMatchesMap();
  const fixtureMap = await getFootballFixtureMap();
  const betsResult = new Array<BetResult>(bets.length);
  for (let i = 0; i < bets.length; i++) {
    const bet = bets[i];
    const match = matchesMap[bet.matchID];
    const { fixture, goals } = fixtureMap[match.fixtureID];
    const status = matchStatus(fixture.status);
    let points = null;
    if (status !== "NOT_STARTED") {
      points = calculatePoints(bet, goals);
    }
    betsResult[i] = { ...bet, match, status, points };
  }
  betsResult.sort((a, b) => a.match.sequence - b.match.sequence);
  return betsResult;
}
