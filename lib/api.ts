import { NextApiRequest, NextApiResponse } from "next";

export function sendError(
  res: NextApiResponse,
  status: number,
  message: string
) {
  return res.status(status).json({ error: message });
}

export function requirePostMethod(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    sendError(res, 405, "Method not allowed");
    return false;
  }
  return true;
}
