/**
 * Backtest da regra de decisão nos jogos JÁ realizados, ISOLANDO a mudança:
 * usa os mesmos λ (lambda_home/lambda_away) que o script original gravou em
 * placares.csv e compara, contra os resultados reais, duas regras de palpite:
 *
 *   - MODAL: placar exato mais provável (regra antiga).
 *   - EV   : palpite que maximiza os pontos esperados (regra nova).
 *
 * Não precisa das odds originais — só dos λ (no CSV) e dos resultados reais.
 *
 * Uso:  npx tsx backtest.ts [lambdas.csv] [resultados.json]
 *   lambdas.csv     default: placares-fase-grupos.csv (cai p/ placares.csv)
 *   resultados.json default: resultados.json
 *
 * resultados.json: array de { home_team, away_team, home_goals, away_goals }.
 * Gere no Supabase (SQL editor) com:
 *   select json_agg(json_build_object(
 *     'home_team', m.home_team, 'away_team', m.away_team,
 *     'home_goals', r.home_goals, 'away_goals', r.away_goals))
 *   from match_results r join matches m on m.id = r.match_id;
 * e salve o JSON como resultados.json nesta pasta.
 */

import { Result, gameKey, loadLambdas, loadResults } from "./io";
import { expectedPointsPick, modalPick, pointsFor, scoreMatrix } from "./model";

import { existsSync } from "node:fs";

// --- tally -----------------------------------------------------------------

interface Tally {
  total: number;
  q12: number;
  q7: number;
  q5: number;
  q2: number;
  q0: number;
}
const newTally = (): Tally => ({
  total: 0,
  q12: 0,
  q7: 0,
  q5: 0,
  q2: 0,
  q0: 0,
});

function add(t: Tally, pts: number) {
  t.total += pts;
  if (pts === 12) t.q12++;
  else if (pts === 7) t.q7++;
  else if (pts === 5) t.q5++;
  else if (pts === 2) t.q2++;
  else t.q0++;
}

function fmt(name: string, t: Tally, n: number): string {
  return `${name.padEnd(8)} | ${String(t.total).padStart(5)} | ${String(t.q12).padStart(3)} | ${String(
    t.q7,
  ).padStart(
    3,
  )} | ${String(t.q5).padStart(3)} | ${String(t.q2).padStart(3)} | ${String(
    t.q0,
  ).padStart(3)} | média ${(t.total / n).toFixed(2)}`;
}

// --- main ------------------------------------------------------------------

function main() {
  const [argLambdas, argResults] = process.argv.slice(2);
  const lambdasPath =
    argLambdas ??
    (existsSync("placares-fase-grupos.csv")
      ? "placares-fase-grupos.csv"
      : "placares.csv");
  const resultsPath = argResults ?? "resultados.json";
  console.log(argResults);
  if (!existsSync(resultsPath)) {
    console.error(
      `Arquivo de resultados não encontrado: ${resultsPath}\n` +
        `Gere-o no Supabase (ver cabeçalho de backtest.ts) e salve como resultados.json.`,
    );
    process.exit(1);
  }

  const games = loadLambdas(lambdasPath);
  const results = loadResults(resultsPath);
  const byKey = new Map<string, Result>();
  for (const r of results) byKey.set(gameKey(r.home, r.away), r);

  const modal = newTally();
  const ev = newTally();
  const changed: string[] = [];
  let matched = 0;
  const unmatched: string[] = [];

  for (const g of games) {
    const r = byKey.get(gameKey(g.home, g.away));
    if (!r) {
      unmatched.push(`${g.home} x ${g.away}`);
      continue;
    }
    matched++;
    const m = scoreMatrix(g.lh, g.la);
    const mp = modalPick(m);
    const ep = expectedPointsPick(m);
    const ptsModal = pointsFor(mp.ph, mp.pa, r.hg, r.ag);
    const ptsEv = pointsFor(ep.ph, ep.pa, r.hg, r.ag);
    add(modal, ptsModal);
    add(ev, ptsEv);
    if (mp.ph !== ep.ph || mp.pa !== ep.pa) {
      changed.push(
        `${g.home} ${g.away}: modal ${mp.ph}-${mp.pa} (${ptsModal}) -> EV ${ep.ph}-${ep.pa} (${ptsEv})  real ${r.hg}-${r.ag}`,
      );
    }
  }

  console.log(`Jogos casados com resultado: ${matched}/${games.length}`);
  if (unmatched.length) {
    console.log(
      `Sem resultado / nome não casou (${unmatched.length}): ${unmatched.join("; ")}`,
    );
  }
  console.log("");
  console.log("Regra    | total | Q12 |  Q7 |  Q5 |  Q2 |  Q0 |");
  console.log(fmt("MODAL", modal, matched));
  console.log(fmt("EV", ev, matched));
  console.log("");
  console.log(`Ganho de pontos com a regra EV: ${ev.total - modal.total}`);
  console.log("");
  console.log(`Jogos em que o palpite mudou (${changed.length}):`);
  for (const c of changed) console.log("  " + c);
}

main();
