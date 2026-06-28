/**
 * Coleta odds da The Odds API (v4) e salva um único JSON consumível pelo modelo.
 *
 *   - Markets "featured" (h2h, spreads, totals) em UMA chamada em lote.
 *   - team_totals POR PARTIDA (só existe no endpoint per-event), mesclado no
 *     mesmo evento. O modelo ainda não consome team_totals; aqui só salvamos
 *     para uso futuro (predict-scores.ts continua lendo os featured).
 *
 * A API key vem de THE_ODDS_API_KEY.
 *
 * Uso:
 *   THE_ODDS_API_KEY=xxxx npx tsx fetch-odds.ts [opções]
 * Opções (todas com default):
 *   --sport=soccer_fifa_world_cup
 *   --regions=us,uk,eu          regiões dos markets featured
 *   --markets=h2h,spreads,totals
 *   --tt-regions=us             regiões do team_totals (per-event; futebol só tem em books US)
 *   --no-team-totals            pula a coleta de team_totals
 *   --out=odds.json
 *   --concurrency=4             requests per-event simultâneos
 *
 * Depois: npx tsx predict-scores.ts odds.json
 */

import { writeFileSync } from "node:fs";

const BASE = "https://api.the-odds-api.com/v4";

// ---------------------------------------------------------------------------
// Tipos (frouxos de propósito: preservamos campos crus como `description`).
// ---------------------------------------------------------------------------
interface RawMarket {
  key: string;
  outcomes: unknown[];
  [k: string]: unknown;
}
interface RawBookmaker {
  key: string;
  markets: RawMarket[];
  [k: string]: unknown;
}
interface RawEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: RawBookmaker[];
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// CLI / config
// ---------------------------------------------------------------------------
function parseArgs(argv: string[]) {
  const flags = new Map<string, string>();
  const bools = new Set<string>();
  for (const a of argv) {
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq === -1) bools.add(a.slice(2));
    else flags.set(a.slice(2, eq), a.slice(eq + 1));
  }
  return {
    sport: flags.get("sport") ?? "soccer_fifa_world_cup",
    regions: flags.get("regions") ?? "us,uk,eu",
    markets: flags.get("markets") ?? "h2h,spreads,totals",
    ttRegions: flags.get("tt-regions") ?? "us",
    teamTotals: !bools.has("no-team-totals"),
    out: flags.get("out") ?? "odds.json",
    concurrency: Math.max(1, Number(flags.get("concurrency") ?? 4)),
  };
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------
interface Quota {
  remaining?: string;
  used?: string;
  last?: string;
}

function readQuota(headers: Headers): Quota {
  return {
    remaining: headers.get("x-requests-remaining") ?? undefined,
    used: headers.get("x-requests-used") ?? undefined,
    last: headers.get("x-requests-last") ?? undefined,
  };
}

async function getJson<T>(url: string): Promise<{ data: T; quota: Quota }> {
  const res = await fetch(url);
  const quota = readQuota(res.headers);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status} ${res.statusText} em ${redact(url)}\n${body}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return { data: (await res.json()) as T, quota };
}

/** Esconde a apiKey ao logar URLs. */
function redact(url: string): string {
  return url.replace(/(apiKey=)[^&]+/, "$1***");
}

function buildUrl(path: string, params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return `${BASE}${path}?${qs}`;
}

/** Executa `fn` sobre `items` com no máximo `n` em paralelo. */
async function pool<T, R>(items: T[], n: number, fn: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------
/** Mescla os bookmakers de `extra` em `ev`, deduplicando por key (une markets). */
function mergeBookmakers(ev: RawEvent, extra: RawBookmaker[]) {
  const byKey = new Map<string, RawBookmaker>();
  for (const bk of ev.bookmakers) byKey.set(bk.key, bk);
  for (const bk of extra) {
    const existing = byKey.get(bk.key);
    if (!existing) {
      ev.bookmakers.push(bk);
      byKey.set(bk.key, bk);
      continue;
    }
    const haveMarket = new Set(existing.markets.map((m) => m.key));
    for (const m of bk.markets) if (!haveMarket.has(m.key)) existing.markets.push(m);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) {
    console.error("Erro: defina THE_ODDS_API_KEY no ambiente.");
    process.exit(1);
  }
  const cfg = parseArgs(process.argv.slice(2));
  console.error(
    `Esporte=${cfg.sport} | featured=[${cfg.markets}] @ ${cfg.regions} | ` +
      `team_totals=${cfg.teamTotals ? cfg.ttRegions : "off"} | out=${cfg.out}`,
  );

  // 1) lote featured
  const featuredUrl = buildUrl(`/sports/${cfg.sport}/odds`, {
    apiKey,
    regions: cfg.regions,
    markets: cfg.markets,
    oddsFormat: "decimal",
  });
  let events: RawEvent[];
  let quota: Quota;
  try {
    const r = await getJson<RawEvent[]>(featuredUrl);
    events = r.data;
    quota = r.quota;
  } catch (e) {
    console.error(`Falha ao buscar featured: ${(e as Error).message}`);
    process.exit(1);
  }
  console.error(`Featured: ${events.length} jogos. Cota usada=${quota.used} restante=${quota.remaining}`);

  // 2) team_totals por evento
  let withTeamTotals = 0;
  if (cfg.teamTotals && events.length) {
    let lastQuota: Quota = quota;
    let warnedNoCoverage = false;
    await pool(events, cfg.concurrency, async (ev, idx) => {
      const url = buildUrl(`/sports/${cfg.sport}/events/${ev.id}/odds`, {
        apiKey,
        regions: cfg.ttRegions,
        markets: "team_totals",
        oddsFormat: "decimal",
      });
      try {
        const r = await getJson<RawEvent>(url);
        lastQuota = r.quota;
        const bks = r.data.bookmakers ?? [];
        if (bks.length) {
          mergeBookmakers(ev, bks);
          withTeamTotals++;
        } else if (idx === 0 && !warnedNoCoverage) {
          warnedNoCoverage = true;
          console.error("Aviso: team_totals sem cobertura no 1º jogo; pode não existir p/ este torneio.");
        }
      } catch (e) {
        const err = e as Error & { status?: number };
        // 404/422 = market/evento indisponível -> segue só com featured
        console.error(`  team_totals falhou em ${ev.home_team} x ${ev.away_team}: ${err.status ?? ""} ${err.message.split("\n")[0]}`);
      }
    });
    console.error(
      `team_totals: ${withTeamTotals}/${events.length} jogos cobertos. ` +
        `Cota usada=${lastQuota.used} restante=${lastQuota.remaining}`,
    );
  }

  // 3) salva
  writeFileSync(cfg.out, JSON.stringify(events, null, 2) + "\n");
  console.error(`Escrito ${cfg.out} (${events.length} jogos, ${withTeamTotals} com team_totals).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
