import { NextApiRequest, NextApiResponse } from "next";
import { getConfig } from "../../../lib/getConfig";
import { getMatchesResult } from "../../../lib/ranking";
import { buildPlaySession, createPlayerForUser } from "../../../lib/play";
import { createUser } from "../../../lib/users";
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
    const { name, cpf, pixKey, secretCode, playerName } = req.body || {};
    if (!name || !cpf || !pixKey || !secretCode || !playerName) {
      return sendError(res, 400, "Preencha todos os campos obrigatórios.");
    }
    const user = await createUser({
      name,
      cpf,
      pixKey,
      secretCode,
    });
    await createPlayerForUser(user.id, playerName);
    const [config, matches] = await Promise.all([getConfig(), getMatchesResult()]);
    const session = await buildPlaySession(user, getPhaseState(config, matches));
    return res.status(200).json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível criar o cadastro.";
    return sendError(res, 400, message);
  }
}
