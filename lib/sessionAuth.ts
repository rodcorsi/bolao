import { createHmac, timingSafeEqual } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { checkAndMigrateUserSecret, getUserByCPF, getUserByID, UserRecord } from "./users";

const SESSION_COOKIE_NAME = "bolao_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface SessionPayload {
  userId: number;
  expiresAt: number;
}

export function setSessionCookie(res: NextApiResponse, user: UserRecord) {
  const token = createSessionToken(user.id);
  res.setHeader("Set-Cookie", buildCookie(token, SESSION_MAX_AGE_SECONDS));
}

export function clearSessionCookie(res: NextApiResponse) {
  res.setHeader("Set-Cookie", buildCookie("", 0));
}

export async function getUserFromRequest(req: NextApiRequest) {
  const userFromCookie = await getUserFromCookieHeader(req.headers.cookie);
  if (userFromCookie) {
    return userFromCookie;
  }
  const { cpf, secretCode } = req.body || {};
  if (cpf && secretCode) {
    const user = await getUserByCPF(cpf);
    if (!user) {
      return null;
    }
    try {
      await checkAndMigrateUserSecret(user, secretCode);
      return user;
    } catch {
      return null;
    }
  }
  return null;
}

export async function getUserFromCookieHeader(cookieHeader?: string | null) {
  const token = readCookie(cookieHeader || undefined, SESSION_COOKIE_NAME);
  if (token) {
    const user = await getUserFromToken(token);
    if (user) {
      return user;
    }
  }
  return null;
}

function createSessionToken(userId: number) {
  const payload: SessionPayload = {
    userId,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

async function getUserFromToken(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeCompare(signature, sign(encodedPayload))) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<SessionPayload>;
    if (
      typeof payload.userId !== "number" ||
      typeof payload.expiresAt !== "number" ||
      Date.now() >= payload.expiresAt
    ) {
      return null;
    }
    return getUserByID(payload.userId);
  } catch {
    return null;
  }
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function getSessionSecret() {
  return (
    process.env.PLAY_SESSION_SECRET ||
    process.env.SUPABASE_ANON_KEY ||
    "development-session-secret"
  );
}

function buildCookie(value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) {
    return null;
  }
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }
  return null;
}

function safeCompare(a: string, b: string) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  if (first.length !== second.length) {
    return false;
  }
  return timingSafeEqual(first, second);
}
