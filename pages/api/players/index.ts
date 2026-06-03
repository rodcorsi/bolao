import { NextApiRequest, NextApiResponse } from "next";
import { buildPlaySession, createPlayerForUser } from "../../../lib/play";
import { requirePostMethod, sendError } from "../../../lib/api";

import { getConfig } from "../../../lib/getConfig";
import { getMatchesResult } from "../../../lib/ranking";
import { getPhaseState } from "../../../lib/phaseState";
import {
  assertInitialPhase,
  assertValidPlayerName,
} from "../../../lib/securityValidation";
import { getUserFromRequest, setSessionCookie } from "../../../lib/sessionAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePostMethod(req, res)) {
    return;
  }
  try {
    const { playerName } = req.body || {};
    if (!playerName) {
      return sendError(res, 400, "Nome do jogador é obrigatório.");
    }
    const user = await getUserFromRequest(req);
    if (!user) {
      return sendError(res, 401, "Sessão inválida.");
    }
    const [config, matches] = await Promise.all([getConfig(), getMatchesResult()]);
    const phaseState = getPhaseState(config, matches);
    assertInitialPhase(phaseState);
    await createPlayerForUser(user.id, assertValidPlayerName(playerName));
    setSessionCookie(res, user);
    const session = await buildPlaySession(user, phaseState);
    return res.status(200).json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível criar o jogador.";
    return sendError(res, 400, message);
  }
}
