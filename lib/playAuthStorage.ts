export type SessionCredentials = {
  cpf: string;
  secretCode: string;
};

const PLAY_AUTH_STORAGE_KEY = "bolao.playAuth";

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
      typeof parsedValue.cpf !== "string" ||
      typeof parsedValue.secretCode !== "string"
    ) {
      return null;
    }
    return {
      cpf: parsedValue.cpf,
      secretCode: parsedValue.secretCode,
    };
  } catch {
    return null;
  }
}

export function savePlayAuth(credentials: SessionCredentials) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    PLAY_AUTH_STORAGE_KEY,
    JSON.stringify(credentials)
  );
}

export function clearPlayAuth() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(PLAY_AUTH_STORAGE_KEY);
}
