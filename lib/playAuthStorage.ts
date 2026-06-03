export type SessionCredentials = {
  cpf: string;
  secretCode: string;
};

const PLAY_AUTH_STORAGE_KEY = "bolao.playAuth";
const PLAY_AUTH_COOKIE_CPF_KEY = "bolao_play_cpf";
const PLAY_AUTH_COOKIE_SECRET_KEY = "bolao_play_secret";

function buildCookieValue(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function parsePlayAuthCookie(cookieHeader?: string | null): SessionCredentials | null {
  if (!cookieHeader) {
    return null;
  }
  const values = cookieHeader.split(";").reduce((acc, item) => {
    const [rawKey, ...rawValue] = item.trim().split("=");
    if (!rawKey || rawValue.length === 0) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {} as Record<string, string>);
  const cpf = values[PLAY_AUTH_COOKIE_CPF_KEY];
  if (!cpf) {
    return null;
  }
  return { cpf, secretCode: "" };
}

export function loadPlayAuth(): SessionCredentials | null {
  if (typeof window === "undefined") {
    return null;
  }
  const rawValue = window.localStorage.getItem(PLAY_AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }
  try {
    const parsedValue = JSON.parse(rawValue) as Partial<SessionCredentials>;
    if (
      typeof parsedValue.cpf !== "string"
    ) {
      return null;
    }
    return {
      cpf: parsedValue.cpf,
      secretCode: "",
    };
  } catch {
    return null;
  }
}

export function savePlayAuth(credentials: SessionCredentials) {
  if (typeof window === "undefined") {
    return;
  }
  const cleanCredentials = {
    cpf: credentials.cpf,
    secretCode: "",
  };
  window.localStorage.setItem(
    PLAY_AUTH_STORAGE_KEY,
    JSON.stringify(cleanCredentials)
  );
  document.cookie = buildCookieValue(PLAY_AUTH_COOKIE_CPF_KEY, credentials.cpf, 60 * 60 * 24 * 30);
  document.cookie = buildCookieValue(
    PLAY_AUTH_COOKIE_SECRET_KEY,
    "",
    0
  );
}

export function clearPlayAuth() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(PLAY_AUTH_STORAGE_KEY);
  document.cookie = buildCookieValue(PLAY_AUTH_COOKIE_CPF_KEY, "", 0);
  document.cookie = buildCookieValue(PLAY_AUTH_COOKIE_SECRET_KEY, "", 0);
}
