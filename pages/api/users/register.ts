import { NextApiRequest, NextApiResponse } from "next";
import { getConfig } from "../../../lib/getConfig";
import { getMatchesResult } from "../../../lib/ranking";
import { buildPlaySession, createPlayerForUser } from "../../../lib/play";
import { createUser } from "../../../lib/users";
import { getPhaseState } from "../../../lib/phaseState";
import { requirePostMethod, sendError } from "../../../lib/api";
import {
  assertInitialPhase,
  assertValidSignupInput,
} from "../../../lib/securityValidation";
import { setSessionCookie } from "../../../lib/sessionAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requirePostMethod(req, res)) {
    return;
  }
  try {
    const input = assertValidSignupInput(req.body || {});
    const [config, matches] = await Promise.all([getConfig(), getMatchesResult()]);
    const phaseState = getPhaseState(config, matches);
    assertInitialPhase(phaseState);
    const user = await createUser({
      name: input.name,
      cpf: input.cpf,
      pixKey: input.pixKey,
      secretCode: input.secretCode,
    });
    await createPlayerForUser(user.id, input.playerName);
    setSessionCookie(res, user);
    const session = await buildPlaySession(user, phaseState);
    return res.status(200).json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível criar o cadastro.";
    return sendError(res, 400, message);
  }
}
