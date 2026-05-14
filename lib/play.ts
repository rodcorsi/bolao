import { supabase } from "./supabaseClient";
import { Bet, getBetsByPlayerIDAndMatchIDs } from "./getBets";
import { getMatchesByFase } from "./getMatches";
import { getPlayersByUserID, Player } from "./getPlayers";
import {
  CompetitionPhase,
  PhaseState,
} from "./tournamentPhase";
import { User } from "./users";

export interface PlayPlayer extends Player {
  bets: Bet[];
}

export interface PlaySession {
  user: User;
  players: PlayPlayer[];
  editablePhase: CompetitionPhase | null;
}

export async function buildPlaySession(
  user: User,
  phaseState: PhaseState
): Promise<PlaySession> {
  const players = await getPlayersByUserID(user.id);
  const editablePhase = phaseState.editablePhase;
  const phaseMatches = editablePhase ? await getMatchesByFase(editablePhase) : [];
  const matchIDs = phaseMatches.map((match) => match.id);
  const playersWithBets = await Promise.all(
    players.map(async (player) => ({
      ...player,
      bets: editablePhase
        ? await getBetsByPlayerIDAndMatchIDs(player.id, matchIDs)
        : [],
    }))
  );
  return {
    user,
    players: playersWithBets,
    editablePhase,
  };
}

export async function createPlayerForUser(userID: number, name: string) {
  const { data, error } = await supabase
    .from("players")
    .insert({
      user_id: userID,
      name: name.trim(),
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return {
    id: data.id,
    userId: data.user_id ?? undefined,
    name: data.name,
  } as Player;
}

export async function upsertBetsForPhase(input: {
  playerID: number;
  editablePhase: CompetitionPhase;
  bets: Bet[];
}) {
  const matches = await getMatchesByFase(input.editablePhase);
  const matchIDs = matches.map((match) => match.id);
  if (matchIDs.length === 0) {
    throw new Error("Nenhum jogo encontrado para a fase aberta.");
  }
  if (input.bets.length !== matchIDs.length) {
    throw new Error("É preciso preencher todos os jogos da fase.");
  }
  const expectedMatchIDs = new Set(matchIDs);
  const submittedMatchIDs = new Set<number>();
  for (const bet of input.bets) {
    if (!expectedMatchIDs.has(bet.matchID)) {
      throw new Error("Palpite enviado para uma fase incorreta.");
    }
    submittedMatchIDs.add(bet.matchID);
    if (
      Number.isNaN(bet.homeGoals) ||
      Number.isNaN(bet.awayGoals) ||
      bet.homeGoals < 0 ||
      bet.awayGoals < 0
    ) {
      throw new Error("Todos os palpites precisam ter placares válidos.");
    }
  }
  if (submittedMatchIDs.size !== expectedMatchIDs.size) {
    throw new Error("É preciso preencher todos os jogos da fase.");
  }
  const { error } = await supabase.from("bets").upsert(
    input.bets.map((bet) => ({
      player_id: input.playerID,
      match_id: bet.matchID,
      home_goals: bet.homeGoals,
      away_goals: bet.awayGoals,
    })),
    { onConflict: "player_id,match_id" }
  );
  if (error) {
    throw new Error(error.message);
  }
}

export function assertEditablePhaseWindow(
  phaseState: PhaseState,
  expectedPhase?: CompetitionPhase | null
) {
  if (phaseState.editablePhase == null) {
    throw new Error("Nenhuma fase está aberta para palpites.");
  }
  if (expectedPhase && phaseState.editablePhase !== expectedPhase) {
    throw new Error("A fase aberta mudou. Recarregue a página.");
  }
  if (phaseState.editablePhaseLockAt) {
    const lockAt = new Date(phaseState.editablePhaseLockAt).getTime();
    if (Date.now() >= lockAt) {
      throw new Error("O prazo para esta fase já foi encerrado.");
    }
  }
}
