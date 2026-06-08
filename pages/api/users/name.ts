import { NextApiRequest, NextApiResponse } from "next";
import { requirePostMethod, sendError } from "../../../lib/api";

import { assertValidUserName } from "../../../lib/securityValidation";
import { buildPlaySession } from "../../../lib/play";
import { getConfig } from "../../../lib/getConfig";
import { getMatchesResult } from "../../../lib/ranking";
import { getPhaseState } from "../../../lib/phaseState";
import { getUserFromRequest, setSessionCookie } from "../../../lib/sessionAuth";
import { updateUserName } from "../../../lib/users";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePostMethod(req, res)) {
    return;
  }
  try {
    const { name } = req.body || {};
    const user = await getUserFromRequest(req);
    if (!user) {
      return sendError(res, 401, "Sessão inválida.");
    }
    const updatedUser = await updateUserName(user.id, assertValidUserName(name));
    setSessionCookie(res, updatedUser);
    const [config, matches] = await Promise.all([
      getConfig(),
      getMatchesResult(),
    ]);
    const phaseState = getPhaseState(config, matches);
    const session = await buildPlaySession(updatedUser, phaseState);
    return res.status(200).json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar o nome.";
    return sendError(res, 400, message);
  }
}
