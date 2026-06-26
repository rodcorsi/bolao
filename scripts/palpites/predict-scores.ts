/**
 * Palpite por jogo (Copa do Mundo 2026) a partir de odds, escolhido pela
 * MAIOR PONTUAÇÃO ESPERADA sob a tabela do bolão (12/7/5/2), e não pelo
 * placar exato mais provável. Ver scripts/palpites/model.ts.
 *
 * Sem dependências externas. Rodar com:  npx tsx predict-scores.ts [arquivos.json...]
 * Se nenhum arquivo for passado, usa odds-ukeu.json (se existir) ou os arquivos us.
 *
 * Saída: placares.csv
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { Event, fitLambdas, scoreMatrix, contrarianPick } from "./model";

// ---------------------------------------------------------------------------
// Carregamento (mescla múltiplos arquivos por id de evento)
// ---------------------------------------------------------------------------
function loadEvents(paths: string[]): Event[] {
  const byId = new Map<string, Event>();
  for (const path of paths) {
    const data: Event[] = JSON.parse(readFileSync(path, "utf8"));
    for (const ev of data) {
      const existing = byId.get(ev.id);
      if (existing) existing.bookmakers.push(...ev.bookmakers);
      else byId.set(ev.id, { ...ev, bookmakers: [...ev.bookmakers] });
    }
  }
  return [...byId.values()].sort((a, b) => a.commence_time.localeCompare(b.commence_time));
}

function resolveInputs(argv: string[]): string[] {
  if (argv.length) return argv;
  if (existsSync("odds-ukeu.json")) return ["odds-ukeu.json"];
  const fallback = ["odds-us-h2h.json", "odds-us-totals.json"].filter(existsSync);
  if (fallback.length) return fallback;
  throw new Error("Nenhum arquivo de odds encontrado. Passe os caminhos como argumentos.");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const inputs = resolveInputs(process.argv.slice(2));
  const events = loadEvents(inputs);
  console.error(`Lidos ${events.length} jogos de: ${inputs.join(", ")}`);

  const rows = [
    "commence_time,home_team,away_team,palpite_ev,ep_ev,palpite_contrario,ep_contrario,pop_pct,custo_ep,lambda_home,lambda_away",
  ];
  for (const ev of events) {
    const { lh, la } = fitLambdas(ev);
    const m = scoreMatrix(lh, la);
    const c = contrarianPick(m);
    const pct = (x: number) => (x * 100).toFixed(1);
    const csvField = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    rows.push(
      [
        ev.commence_time,
        csvField(ev.home_team),
        csvField(ev.away_team),
        `${c.evPh}-${c.evPa}`,
        c.evEp.toFixed(2),
        `${c.ph}-${c.pa}`,
        c.ep.toFixed(2),
        pct(c.pop),
        c.costEp.toFixed(2),
        lh.toFixed(2),
        la.toFixed(2),
      ].join(","),
    );
  }

  writeFileSync("placares.csv", rows.join("\n") + "\n");
  console.error(`Escrito placares.csv (${rows.length - 1} jogos).`);
}

main();
