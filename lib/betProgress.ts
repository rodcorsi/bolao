import { CompetitionPhase, getMatchesForCompetitionPhase } from "./tournamentPhase";

import type { MatchResult } from "./ranking";
import { getBetsRawByMatchIDs } from "./getBets";
import getPlayers from "./getPlayers";

export interface BetFillProgress {
  totalMatches: number;
  totalPlayers: number;
  completePlayers: number;
  pending: Array<{ playerName: string; userName: string }>;
}

export async function getBetFillProgress(
  editablePhase: CompetitionPhase,
  matches: MatchResult[],
): Promise<BetFillProgress | null> {
  const phaseMatches = getMatchesForCompetitionPhase(matches, editablePhase);
  const matchIDs = phaseMatches.map((match) => match.id);
  if (matchIDs.length === 0) {
    return null;
  }

  const [players, bets] = await Promise.all([
    getPlayers(),
    getBetsRawByMatchIDs(matchIDs),
  ]);

  const completeByPlayer = new Map<number, number>();
  for (const bet of bets) {
    if (bet.homeGoals != null && bet.awayGoals != null) {
      completeByPlayer.set(
        bet.playerID,
        (completeByPlayer.get(bet.playerID) ?? 0) + 1,
      );
    }
  }

  const totalMatches = matchIDs.length;
  let completePlayers = 0;
  const pending: BetFillProgress["pending"] = [];
  for (const player of players) {
    const completeCount = completeByPlayer.get(player.id) ?? 0;
    if (completeCount === totalMatches) {
      completePlayers += 1;
    } else {
      pending.push({
        playerName: player.name,
        userName: player.userName ?? player.name,
      });
    }
  }

  pending.sort(
    (a, b) =>
      a.userName.localeCompare(b.userName) ||
      a.playerName.localeCompare(b.playerName),
  );

  return {
    totalMatches,
    totalPlayers: players.length,
    completePlayers,
    pending,
  };
}
