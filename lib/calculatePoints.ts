import { Bet } from "./getBets";
import { Goals } from "./getFootballFixture";
import config from "../static_data/config.json";

const scorePoints = config.scorePoints;

export default function calculatePoints(bet: Bet, score: Goals) {
  if (score.home == null || score.away == null) {
    return 0;
  }
  if (bet.homeGoals === score.home && bet.awayGoals === score.away) {
    return scorePoints.EXACT;
  }
  const betResult = Math.sign(bet.homeGoals - bet.awayGoals);
  const scoreResult = Math.sign(score.home - score.away);
  const rightWinner = betResult === scoreResult;
  const oneScore = bet.homeGoals === score.home || bet.awayGoals === score.away;
  if (rightWinner && oneScore) {
    return scorePoints.WINNER_AND_ONE_SCORE;
  }
  if (rightWinner) {
    return scorePoints.WINNER;
  }
  if (oneScore) {
    return scorePoints.ONE_SCORE;
  }
  return 0;
}
