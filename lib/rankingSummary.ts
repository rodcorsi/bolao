import type { ScorePoints } from "./getConfig";
import type { BetResult, CountPoints, MatchResult, RankingItem } from "./ranking";

export function sumPoints(bets: BetResult[]) {
  let points = 0;
  for (const bet of bets) {
    if (bet.points != null) {
      points += bet.points;
    }
  }
  return points;
}

export function countPoints(
  bets: BetResult[],
  scorePoints: ScorePoints
): CountPoints {
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

export function sortRankingItems(items: RankingItem[]) {
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
  if (a.countPoints.winnerAndOneScore !== b.countPoints.winnerAndOneScore) {
    return false;
  }
  if (a.countPoints.winner !== b.countPoints.winner) return false;
  return true;
}

export function bestRankingForMatches(
  matches: MatchResult[],
  items: RankingItem[],
  tryMaxItems: number,
  scorePoints: ScorePoints
): RankingItem[] {
  let best = filterToPosition(rankingForMatches(matches, items, scorePoints), 3);
  if (best.length <= tryMaxItems) {
    return best;
  }
  best = filterToPosition(best, 2);
  if (best.length <= tryMaxItems) {
    return best;
  }
  return filterToPosition(best, 1);
}

function filterToPosition(itemsForMatches: RankingItem[], toPosition: number) {
  return itemsForMatches.filter(
    (item) => item.points > 0 && item.position <= toPosition
  );
}

export function rankingForMatches(
  matches: MatchResult[],
  items: RankingItem[],
  scorePoints: ScorePoints
): RankingItem[] {
  const matchSet = matches.reduce(
    (set, match) => set.add(match.id),
    new Set<number>()
  );
  const itemsForMatches = items.map((item) => {
    const bets = item.bets.filter((bet) => matchSet.has(bet.matchID));
    return {
      ...item,
      bets,
      points: sumPoints(bets),
      countPoints: countPoints(bets, scorePoints),
    } as RankingItem;
  });
  sortRankingItems(itemsForMatches);
  return itemsForMatches;
}
