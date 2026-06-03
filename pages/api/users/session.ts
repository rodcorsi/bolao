import { NextApiRequest, NextApiResponse } from "next";
import { checkAndMigrateUserSecret, getUserByCPF } from "../../../lib/users";
import { requirePostMethod, sendError } from "../../../lib/api";

import { buildPlaySession } from "../../../lib/play";
import { getConfig } from "../../../lib/getConfig";
import { getMatchesResult } from "../../../lib/ranking";
import { getPhaseState } from "../../../lib/phaseState";
import { getUserFromRequest, setSessionCookie } from "../../../lib/sessionAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePostMethod(req, res)) {
    return;
  }
  try {
    const { cpf, secretCode } = req.body || {};
    if (!cpf || !secretCode) {
      const user = await getUserFromRequest(req);
      if (!user) {
        return sendError(res, 401, "Sessão inválida.");
      }
      setSessionCookie(res, user);
      const [config, matches] = await Promise.all([getConfig(), getMatchesResult()]);
      const session = await buildPlaySession(user, getPhaseState(config, matches));
      return res.status(200).json({ session });
    }
    const user = await getUserByCPF(cpf);
    if (!user) {
      return sendError(res, 404, "Usuário não encontrado.");
    }
    await checkAndMigrateUserSecret(user, secretCode);
    setSessionCookie(res, user);
    const [config, matches] = await Promise.all([getConfig(), getMatchesResult()]);
    const session = await buildPlaySession(user, getPhaseState(config, matches));
    return res.status(200).json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível abrir a sessão.";
    return sendError(res, 400, message);
  }
}
