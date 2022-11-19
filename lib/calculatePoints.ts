import { Bet } from "./getBets";
import { Goals } from "./getFootballFixture";

const MAX_POINTS = 12;
const RESULT_POINTS = 5;
const ONE_SCORE_POINTS = 2;

export default function calculatePoints(bet: Bet, score: Goals) {
  if (score.home == null || score.away == null) {
    return 0;
  }
  if (bet.homeGoals === score.home && bet.awayGoals === score.away) {
    return MAX_POINTS;
  }
  let points = 0;
  const betResult = Math.sign(bet.homeGoals - bet.awayGoals);
  const scoreResult = Math.sign(score.home - score.away);
  if (betResult === scoreResult) {
    points = RESULT_POINTS;
  }
  if (bet.homeGoals === score.home || bet.awayGoals === score.away) {
    points += ONE_SCORE_POINTS;
  }
  return points;
}
