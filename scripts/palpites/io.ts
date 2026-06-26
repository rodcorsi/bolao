/**
 * Helpers de parsing/normalização compartilhados pelos backtests.
 */
import { readFileSync } from "node:fs";

/** Parser de uma linha CSV com aspas (campos podem conter vírgula). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Número que pode vir com vírgula decimal (pt-BR), ex.: "1,84" -> 1.84. */
export function ptNumber(s: string): number {
  return parseFloat(s.trim().replace(",", "."));
}

/** Variantes de nome entre a The Odds API e o Supabase -> forma canônica. */
const ALIASES: Record<string, string> = {
  usa: "unitedstates",
  czechrepublic: "czechia",
  bosniaandherzegovina: "bosnia",
  bosniaherzegovina: "bosnia",
  capeverde: "capeverde",
  capeverdeislands: "capeverde",
  drcongo: "congo",
  congodr: "congo",
};

export function normalize(s: string): string {
  const base = String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
  return ALIASES[base] ?? base;
}

/** Chave de jogo (mandante|visitante normalizados). */
export function gameKey(home: string, away: string): string {
  return normalize(home) + "|" + normalize(away);
}

export interface GameLambda {
  home: string;
  away: string;
  lh: number;
  la: number;
}

/** Lê os λ do CSV de palpites (suporta o formato antigo e o novo). */
export function loadLambdas(path: string): GameLambda[] {
  const lines = readFileSync(path, "utf8").split("\n").filter((l) => l.trim().length);
  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const iHome = idx("home_team");
  const iAway = idx("away_team");
  const iLh = idx("lambda_home");
  const iLa = idx("lambda_away");
  if (iHome < 0 || iAway < 0 || iLh < 0 || iLa < 0)
    throw new Error(`CSV sem colunas esperadas (home_team/away_team/lambda_home/lambda_away): ${path}`);
  const games: GameLambda[] = [];
  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i]);
    const lh = ptNumber(f[iLh]);
    const la = ptNumber(f[iLa]);
    if (!isFinite(lh) || !isFinite(la)) continue;
    games.push({ home: f[iHome], away: f[iAway], lh, la });
  }
  return games;
}

export interface Result {
  home: string;
  away: string;
  hg: number;
  ag: number;
}

export function loadResults(path: string): Result[] {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const arr: any[] = Array.isArray(raw) ? raw : raw.data ?? [];
  return arr
    .map((r) => ({
      home: String(r.home_team),
      away: String(r.away_team),
      hg: Number(r.home_goals),
      ag: Number(r.away_goals),
    }))
    .filter((r) => isFinite(r.hg) && isFinite(r.ag));
}

export interface PlayerBet {
  playerId: number;
  home: string;
  away: string;
  hg: number;
  ag: number;
}

/** Lê bets.json (todas as apostas + nomes dos times). Ignora palpites nulos. */
export function loadBets(path: string): PlayerBet[] {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const arr: any[] = Array.isArray(raw) ? raw : raw.data ?? [];
  return arr
    .map((b) => ({
      playerId: Number(b.player_id),
      home: String(b.home_team),
      away: String(b.away_team),
      hg: Number(b.home_goals),
      ag: Number(b.away_goals),
    }))
    .filter((b) => isFinite(b.hg) && isFinite(b.ag) && isFinite(b.playerId));
}
