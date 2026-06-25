import { NextApiRequest, NextApiResponse } from "next";

import { sendError } from "../../../lib/api";
import { syncMatches } from "../../../lib/syncMatches";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return sendError(res, 401, "Unauthorized");
  }
  try {
    const summary = await syncMatches();
    return res.status(200).json(summary);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync matches";
    console.error("sync-matches cron error:", error);
    return sendError(res, 500, message);
  }
}
