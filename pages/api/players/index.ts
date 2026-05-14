import { NextApiRequest, NextApiResponse } from "next";
import { getConfig } from "../../../lib/getConfig";
import { getMatchesResult } from "../../../lib/ranking";
import { buildPlaySession, createPlayerForUser } from "../../../lib/play";
import { getUserByCPF, assertUserSecret } from "../../../lib/users";
import { getPhaseState } from "../../../lib/phaseState";
import { requirePostMethod, sendError } from "../../../lib/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePostMethod(req, res)) {
    return;
  }
  try {
    const { cpf, secretCode, playerName } = req.body || {};
    if (!cpf || !secretCode || !playerName) {
      return sendError(res, 400, "CPF, código secreto e nome do jogador são obrigatórios.");
    }
    const user = await getUserByCPF(cpf);
    if (!user) {
      return sendError(res, 404, "Usuário não encontrado.");
    }
    assertUserSecret(user, secretCode);
    await createPlayerForUser(user.id, playerName);
    const [config, matches] = await Promise.all([getConfig(), getMatchesResult()]);
    const session = await buildPlaySession(user, getPhaseState(config, matches));
    return res.status(200).json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível criar o jogador.";
    return sendError(res, 400, message);
  }
}
