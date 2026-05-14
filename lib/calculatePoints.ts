import { Bet } from "./getBets";
import { Goals } from "./getFootballFixture";
import { ScorePoints } from "./getConfig";

export default function calculatePoints(
  bet: Bet,
  score: Goals,
  scorePoints: ScorePoints,
) {
  if (score.homeTeam == null || score.awayTeam == null) {
    return 0;
  }
  if (bet.homeGoals === score.homeTeam && bet.awayGoals === score.awayTeam) {
    return scorePoints.EXACT;
  }
  const betResult = Math.sign(bet.homeGoals - bet.awayGoals);
  const scoreResult = Math.sign(score.homeTeam - score.awayTeam);
  const rightWinner = betResult === scoreResult;
  const oneScore =
    bet.homeGoals === score.homeTeam || bet.awayGoals === score.awayTeam;
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
