import { NextApiRequest, NextApiResponse } from "next";
import { Bet } from "../../../lib/getBets";
import { getConfig } from "../../../lib/getConfig";
import { getPlayersByUserID } from "../../../lib/getPlayers";
import { getMatchesResult } from "../../../lib/ranking";
import {
  assertEditablePhaseWindow,
  buildPlaySession,
  upsertBetsForPhase,
} from "../../../lib/play";
import { getPhaseState } from "../../../lib/phaseState";
import { assertUserSecret, getUserByCPF } from "../../../lib/users";
import { requirePostMethod, sendError } from "../../../lib/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePostMethod(req, res)) {
    return;
  }
  try {
    const { cpf, secretCode, playerId, editablePhase, bets } = req.body || {};
    if (!cpf || !secretCode || !playerId || !editablePhase || !Array.isArray(bets)) {
      return sendError(res, 400, "Dados inválidos para salvar os palpites.");
    }
    const user = await getUserByCPF(cpf);
    if (!user) {
      return sendError(res, 404, "Usuário não encontrado.");
    }
    assertUserSecret(user, secretCode);
    const userPlayers = await getPlayersByUserID(user.id);
    if (!userPlayers.some((player) => player.id === Number(playerId))) {
      return sendError(res, 403, "Este jogador não pertence ao usuário informado.");
    }
    const [config, matches] = await Promise.all([getConfig(), getMatchesResult()]);
    const phaseState = getPhaseState(config, matches);
    assertEditablePhaseWindow(phaseState, editablePhase);
    await upsertBetsForPhase({
      playerID: Number(playerId),
      editablePhase,
      bets: bets.map((bet: Bet) => ({
        playerID: Number(playerId),
        matchID: Number(bet.matchID),
        homeGoals: Number(bet.homeGoals),
        awayGoals: Number(bet.awayGoals),
      })),
    });
    const session = await buildPlaySession(user, phaseState);
    return res.status(200).json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar os palpites.";
    return sendError(res, 400, message);
  }
}
