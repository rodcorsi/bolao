/**
 * Backtest por POSIÇÃO (não só pontos) da fase de grupos.
 *
 * Reconstrói a classificação real dos jogadores a partir das apostas (bets.json)
 * e dos resultados (resultados.json), e mede em que POSIÇÃO o usuário terminaria
 * se tivesse usado cada estratégia nos jogos modelados (λ em placares-fase-grupos.csv):
 *   - MODAL (placar mais provável, regra antiga)
 *   - EV    (pontos esperados)
 *   - EV+CONTRÁRIO (desempate barato anti-multidão)
 *
 * Também calibra/valida o modelo de multidão (crowdPopularity) contra a frequência
 * real de palpites.
 *
 * Uso:  npx tsx rank-backtest.ts [bets.json] [resultados.json] [placares-fase-grupos.csv] [--user=ID]
 *
 * bets.json (SQL editor do Supabase):
 *   select json_agg(json_build_object(
 *     'match_id', b.match_id, 'home_team', m.home_team, 'away_team', m.away_team,
 *     'player_id', b.player_id, 'home_goals', b.home_goals, 'away_goals', b.away_goals))
 *   from bets b join matches m on m.id = b.match_id;
 */

import { existsSync } from "node:fs";
import {
  scoreMatrix,
  modalPick,
  expectedPointsPick,
  contrarianPick,
  crowdPopularity,
  pointsFor,
  MAX_PICK,
} from "./model";
import { loadLambdas, loadResults, loadBets, gameKey, PlayerBet, Result } from "./io";

interface Tally {
  total: number;
  q12: number;
  q7: number;
  q5: number;
  q2: number;
  q0: number;
}
function addPts(t: Tally, pts: number) {
  t.total += pts;
  if (pts === 12) t.q12++;
  else if (pts === 7) t.q7++;
  else if (pts === 5) t.q5++;
  else if (pts === 2) t.q2++;
  else t.q0++;
}

/** Coeficiente de correlação de Pearson. */
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return NaN;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0,
    sxx = 0,
    syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxy / Math.sqrt(sxx * syy || 1);
}

function position(total: number, totals: number[]): number {
  return 1 + totals.filter((t) => t > total).length;
}

function main() {
  const args = process.argv.slice(2);
  const userArg = args.find((a) => a.startsWith("--user="));
  const userIdArg = userArg ? Number(userArg.split("=")[1]) : undefined;
  const positional = args.filter((a) => !a.startsWith("--"));
  const betsPath = positional[0] ?? "bets.json";
  const resultsPath = positional[1] ?? "resultados.json";
  const lambdasPath =
    positional[2] ?? (existsSync("placares-fase-grupos.csv") ? "placares-fase-grupos.csv" : "placares.csv");

  for (const [label, p] of [
    ["bets.json", betsPath],
    ["resultados.json", resultsPath],
  ] as const) {
    if (!existsSync(p)) {
      console.error(`Arquivo não encontrado: ${p} (esperado ${label}). Ver cabeçalho de rank-backtest.ts.`);
      process.exit(1);
    }
  }

  const bets = loadBets(betsPath);
  const results = loadResults(resultsPath);
  const lambdas = loadLambdas(lambdasPath);

  const resultByKey = new Map<string, Result>();
  for (const r of results) resultByKey.set(gameKey(r.home, r.away), r);
  const lambdaByKey = new Map<string, { lh: number; la: number }>();
  for (const g of lambdas) lambdaByKey.set(gameKey(g.home, g.away), { lh: g.lh, la: g.la });

  // apostas por jogador e por jogo
  const players = new Map<number, Map<string, PlayerBet>>();
  for (const b of bets) {
    let pm = players.get(b.playerId);
    if (!pm) players.set(b.playerId, (pm = new Map()));
    pm.set(gameKey(b.home, b.away), b);
  }

  // --- classificação real (todas as apostas, todos os jogos com resultado) ---
  const tallies = new Map<number, Tally>();
  for (const [pid, pm] of players) {
    const t: Tally = { total: 0, q12: 0, q7: 0, q5: 0, q2: 0, q0: 0 };
    for (const [key, bet] of pm) {
      const r = resultByKey.get(key);
      if (!r) continue;
      addPts(t, pointsFor(bet.hg, bet.ag, r.hg, r.ag));
    }
    tallies.set(pid, t);
  }

  // --- identificar o usuário (perfil real conhecido: 266 / 9-9-11-20-11) ----
  const KNOWN = { total: 266, q12: 9, q7: 9, q5: 11, q2: 20, q0: 11 };
  let userId = userIdArg;
  if (userId == null) {
    const exact = [...tallies.entries()].find(
      ([, t]) =>
        t.total === KNOWN.total &&
        t.q12 === KNOWN.q12 &&
        t.q7 === KNOWN.q7 &&
        t.q5 === KNOWN.q5 &&
        t.q2 === KNOWN.q2 &&
        t.q0 === KNOWN.q0,
    );
    userId = exact?.[0] ?? [...tallies.entries()].find(([, t]) => t.total === KNOWN.total)?.[0];
  }
  if (userId == null || !players.has(userId)) {
    console.error(
      "Não consegui identificar o usuário automaticamente. Candidatos com total≈266:\n" +
        [...tallies.entries()]
          .filter(([, t]) => Math.abs(t.total - 266) <= 6)
          .map(([pid, t]) => `  player ${pid}: ${t.total} (Q12=${t.q12} Q7=${t.q7} Q5=${t.q5} Q2=${t.q2} Q0=${t.q0})`)
          .join("\n") +
        "\nRode novamente com --user=ID.",
    );
    process.exit(1);
  }

  const userBets = players.get(userId)!;
  const userTally = tallies.get(userId)!;
  const othersTotals = [...tallies.entries()].filter(([pid]) => pid !== userId).map(([, t]) => t.total);

  // --- recomputar o total do usuário sob cada estratégia ---------------------
  type Strat = "MODAL" | "EV" | "CONTRA";
  const stratTotal: Record<Strat, number> = { MODAL: 0, EV: 0, CONTRA: 0 };
  let modeled = 0;
  let contraCostEp = 0;
  const changed: string[] = [];

  // dados para validação do modelo de multidão
  const matricesByKey = new Map<string, number[][]>();

  for (const [key, r] of resultByKey) {
    const lam = lambdaByKey.get(key);
    if (!lam) {
      // jogo sem λ: mantém a aposta real do usuário em todas as estratégias
      const bet = userBets.get(key);
      if (bet) {
        const p = pointsFor(bet.hg, bet.ag, r.hg, r.ag);
        stratTotal.MODAL += p;
        stratTotal.EV += p;
        stratTotal.CONTRA += p;
      }
      continue;
    }
    modeled++;
    const m = scoreMatrix(lam.lh, lam.la);
    matricesByKey.set(key, m);
    const mp = modalPick(m);
    const ev = expectedPointsPick(m);
    const c = contrarianPick(m);
    contraCostEp += c.costEp;
    stratTotal.MODAL += pointsFor(mp.ph, mp.pa, r.hg, r.ag);
    stratTotal.EV += pointsFor(ev.ph, ev.pa, r.hg, r.ag);
    stratTotal.CONTRA += pointsFor(c.ph, c.pa, r.hg, r.ag);
    if (c.ph !== c.evPh || c.pa !== c.evPa) {
      changed.push(
        `${key.replace("|", " x ")}: EV ${c.evPh}-${c.evPa} (pop ${(c.evPop * 100).toFixed(0)}%) ` +
          `-> CONTRA ${c.ph}-${c.pa} (pop ${(c.pop * 100).toFixed(0)}%, custo ${c.costEp.toFixed(2)})  real ${r.hg}-${r.ag}`,
      );
    }
  }

  const posReal = position(userTally.total, othersTotals);
  const posOf = (total: number) => position(total, othersTotals);

  // --- validação do modelo de multidão --------------------------------------
  // frequência empírica de palpites por placar em cada jogo modelado
  const empByKey = new Map<string, number[][]>();
  for (const [key] of matricesByKey) {
    const grid = Array.from({ length: MAX_PICK + 1 }, () => new Array(MAX_PICK + 1).fill(0));
    let n = 0;
    for (const pm of players.values()) {
      const bet = pm.get(key);
      if (!bet) continue;
      if (bet.hg > MAX_PICK || bet.ag > MAX_PICK) continue;
      grid[bet.hg][bet.ag]++;
      n++;
    }
    if (n > 0) for (let i = 0; i <= MAX_PICK; i++) for (let j = 0; j <= MAX_PICK; j++) grid[i][j] /= n;
    empByKey.set(key, grid);
  }

  const betas = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
  let bestBeta = betas[0];
  let bestCorr = -Infinity;
  const corrByBeta: Record<string, number> = {};
  for (const beta of betas) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const [key, m] of matricesByKey) {
      const pop = crowdPopularity(m, beta);
      const emp = empByKey.get(key)!;
      for (let i = 0; i <= MAX_PICK; i++)
        for (let j = 0; j <= MAX_PICK; j++) {
          xs.push(pop[i][j]);
          ys.push(emp[i][j]);
        }
    }
    const c = pearson(xs, ys);
    corrByBeta[beta.toFixed(1)] = c;
    if (c > bestCorr) {
      bestCorr = c;
      bestBeta = beta;
    }
  }

  // o placar mais provável (modal) bate com o mais apostado real?
  let modalMatchesCrowd = 0;
  for (const [key, m] of matricesByKey) {
    const mp = modalPick(m);
    const emp = empByKey.get(key)!;
    let bi = 0,
      bj = 0,
      bv = -1;
    for (let i = 0; i <= MAX_PICK; i++)
      for (let j = 0; j <= MAX_PICK; j++)
        if (emp[i][j] > bv) {
          bv = emp[i][j];
          bi = i;
          bj = j;
        }
    if (mp.ph === bi && mp.pa === bj) modalMatchesCrowd++;
  }

  // --- saída ----------------------------------------------------------------
  console.log(`Jogadores: ${players.size} | jogos com resultado: ${resultByKey.size} | modelados (com λ): ${modeled}`);
  console.log(
    `Usuário identificado: player ${userId} | real ${userTally.total} pts ` +
      `(Q12=${userTally.q12} Q7=${userTally.q7} Q5=${userTally.q5} Q2=${userTally.q2} Q0=${userTally.q0})`,
  );
  console.log("");
  console.log("Estratégia       | total | posição");
  console.log(`REAL (suas)      | ${String(userTally.total).padStart(5)} | ${posReal}º`);
  console.log(`MODAL            | ${String(stratTotal.MODAL).padStart(5)} | ${posOf(stratTotal.MODAL)}º`);
  console.log(`EV               | ${String(stratTotal.EV).padStart(5)} | ${posOf(stratTotal.EV)}º`);
  console.log(`EV+CONTRÁRIO     | ${String(stratTotal.CONTRA).padStart(5)} | ${posOf(stratTotal.CONTRA)}º`);
  console.log("");
  console.log(
    `Custo total de EP do contrário vs EV: ${contraCostEp.toFixed(2)} pts esperados ` +
      `(realizado: ${stratTotal.CONTRA - stratTotal.EV} pts), em ${changed.length} jogos alterados.`,
  );
  console.log("");
  console.log("Validação do modelo de multidão:");
  console.log(`  Correlação pop×frequência real por β: ${betas.map((b) => `${b.toFixed(1)}=${corrByBeta[b.toFixed(1)].toFixed(2)}`).join("  ")}`);
  console.log(`  Melhor β = ${bestBeta} (corr ${bestCorr.toFixed(2)}). Default do modelo: 1.4.`);
  console.log(`  Jogos em que o placar modal = o mais apostado real: ${modalMatchesCrowd}/${matricesByKey.size}`);
  console.log("");
  console.log(`Jogos em que o contrário difere do EV (${changed.length}):`);
  for (const c of changed) console.log("  " + c);
}

main();
