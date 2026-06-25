import { NextApiRequest, NextApiResponse } from "next";

import { consolidateResults } from "../../../lib/consolidateResults";
import { sendError } from "../../../lib/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return sendError(res, 401, "Unauthorized");
  }
  try {
    const summary = await consolidateResults();
    return res.status(200).json(summary);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to consolidate results";
    console.error("consolidate-results cron error:", error);
    return sendError(res, 500, message);
  }
}
