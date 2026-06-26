/**
 * Afinação de β / EPS / MIN_REL_GAP com base GENERALIZÁVEL (não no resultado
 * único que aconteceu):
 *
 *   - β: escolhido pela correlação pop×frequência real de palpites (sem resultado).
 *   - EPS / MIN_REL_GAP: avaliados por RANK ESPERADO via Monte Carlo — fixa as
 *     apostas reais dos adversários e sorteia K cenários de resultado a partir das
 *     MATRIZES (não do placar real), medindo E[posição], P(top-3) e P(1º).
 *     Usa números aleatórios comuns (mesmos sorteios p/ todos os parâmetros).
 *
 * Uso:  npx tsx tune.ts [bets.json] [resultados.json] [placares-fase-grupos.csv] [--user=ID] [--k=20000]
 */

import { existsSync } from "node:fs";
import {
  scoreMatrix,
  modalPick,
  expectedPointsPick,
  contrarianPick,
  crowdPopularity,
  pointsFor,
  MAX_GOALS,
  MAX_PICK,
} from "./model";
import { loadLambdas, loadResults, loadBets, gameKey, PlayerBet, Result } from "./io";

const W = MAX_GOALS + 1; // largura da grade de resultados (0..MAX_GOALS)
const NOUT = W * W;
const oi = (o: number) => Math.floor(o / W);
const oj = (o: number) => o % W;

/** RNG determinístico (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  return sxy / Math.sqrt(sxx * syy || 1);
}

function findUser(players: Map<number, Map<string, PlayerBet>>, resultByKey: Map<string, Result>, override?: number) {
  if (override != null) return override;
  const KNOWN = { total: 266, q12: 9, q7: 9, q5: 11, q2: 20, q0: 11 };
  let fallback: number | undefined;
  for (const [pid, pm] of players) {
    const t = { total: 0, q12: 0, q7: 0, q5: 0, q2: 0, q0: 0 } as any;
    for (const [k, b] of pm) {
      const r = resultByKey.get(k);
      if (!r) continue;
      const p = pointsFor(b.hg, b.ag, r.hg, r.ag);
      t.total += p;
      if (p === 12) t.q12++; else if (p === 7) t.q7++; else if (p === 5) t.q5++; else if (p === 2) t.q2++; else t.q0++;
    }
    if (t.total === KNOWN.total) {
      fallback = pid;
      if (t.q12 === KNOWN.q12 && t.q7 === KNOWN.q7 && t.q5 === KNOWN.q5 && t.q2 === KNOWN.q2 && t.q0 === KNOWN.q0) return pid;
    }
  }
  return fallback;
}

function main() {
  const args = process.argv.slice(2);
  const opt = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
  const userIdArg = opt("user") ? Number(opt("user")) : undefined;
  const K = opt("k") ? Number(opt("k")) : 20000;
  const positional = args.filter((a) => !a.startsWith("--"));
  const betsPath = positional[0] ?? "bets.json";
  const resultsPath = positional[1] ?? "resultados.json";
  const lambdasPath = positional[2] ?? (existsSync("placares-fase-grupos.csv") ? "placares-fase-grupos.csv" : "placares.csv");

  for (const p of [betsPath, resultsPath]) if (!existsSync(p)) { console.error(`Arquivo não encontrado: ${p}`); process.exit(1); }

  const bets = loadBets(betsPath);
  const results = loadResults(resultsPath);
  const lambdas = loadLambdas(lambdasPath);
  const resultByKey = new Map<string, Result>();
  for (const r of results) resultByKey.set(gameKey(r.home, r.away), r);
  const lambdaByKey = new Map<string, { lh: number; la: number }>();
  for (const g of lambdas) lambdaByKey.set(gameKey(g.home, g.away), { lh: g.lh, la: g.la });

  const players = new Map<number, Map<string, PlayerBet>>();
  for (const b of bets) {
    let pm = players.get(b.playerId);
    if (!pm) players.set(b.playerId, (pm = new Map()));
    pm.set(gameKey(b.home, b.away), b);
  }
  const userId = findUser(players, resultByKey, userIdArg);
  if (userId == null) { console.error("Usuário não identificado; use --user=ID."); process.exit(1); }

  // jogos modelados (λ ∩ resultado), na ordem
  const keys = [...resultByKey.keys()].filter((k) => lambdaByKey.has(k));
  const G = keys.length;
  const matrices = keys.map((k) => scoreMatrix(lambdaByKey.get(k)!.lh, lambdaByKey.get(k)!.la));
  const cums = matrices.map((m) => {
    const cum = new Float64Array(NOUT);
    let acc = 0;
    for (let o = 0; o < NOUT; o++) { acc += m[oi(o)][oj(o)]; cum[o] = acc; }
    return cum;
  });

  const oppIds = [...players.keys()].filter((p) => p !== userId);
  const nOpp = oppIds.length;

  // pontos do adversário por jogo×resultado (precompute)
  const oppPts: Int16Array[] = []; // [g] -> length NOUT*nOpp
  for (let g = 0; g < G; g++) {
    const arr = new Int16Array(NOUT * nOpp);
    for (let p = 0; p < nOpp; p++) {
      const bet = players.get(oppIds[p])!.get(keys[g]);
      if (!bet) continue; // sem aposta -> 0 em todo resultado
      for (let o = 0; o < NOUT; o++) arr[o * nOpp + p] = pointsFor(bet.hg, bet.ag, oi(o), oj(o));
    }
    oppPts.push(arr);
  }

  // sorteios comuns + totais dos adversários por simulação (uma vez só)
  const rand = rng(12345);
  const samples = new Uint8Array(K * G);
  const oppTot = new Int16Array(K * nOpp);
  for (let k = 0; k < K; k++) {
    for (let g = 0; g < G; g++) {
      const u = rand();
      const cum = cums[g];
      let o = 0;
      while (o < NOUT - 1 && u > cum[o]) o++;
      samples[k * G + g] = o;
      const base = oppPts[g];
      const ko = k * nOpp;
      for (let p = 0; p < nOpp; p++) oppTot[ko + p] += base[o * nOpp + p];
    }
  }

  // avalia um vetor de palpites do usuário (pi,pj por jogo) por Monte Carlo
  function evalPicks(picks: [number, number][]) {
    // pontos do usuário por jogo×resultado
    const uPts: Int16Array[] = picks.map(([pi, pj], g) => {
      void g;
      const a = new Int16Array(NOUT);
      for (let o = 0; o < NOUT; o++) a[o] = pointsFor(pi, pj, oi(o), oj(o));
      return a;
    });
    let sumRank = 0, top1 = 0, top3 = 0, sumPts = 0;
    for (let k = 0; k < K; k++) {
      let ut = 0;
      for (let g = 0; g < G; g++) ut += uPts[g][samples[k * G + g]];
      sumPts += ut;
      let better = 0;
      const ko = k * nOpp;
      for (let p = 0; p < nOpp; p++) if (oppTot[ko + p] > ut) better++;
      const pos = better + 1;
      sumRank += pos;
      if (pos === 1) top1++;
      if (pos <= 3) top3++;
    }
    return { eRank: sumRank / K, pTop1: top1 / K, pTop3: top3 / K, ePts: sumPts / K };
  }

  // baselines
  const modalPicks = matrices.map((m) => { const p = modalPick(m); return [p.ph, p.pa] as [number, number]; });
  const evPicks = matrices.map((m) => { const p = expectedPointsPick(m); return [p.ph, p.pa] as [number, number]; });
  const evEP = matrices.map((m) => expectedPointsPick(m).ep);

  // --- β por correlação (objetivo sem resultado) ----------------------------
  const empByGame = keys.map((key) => {
    const grid = new Array<number>(NOUT).fill(0);
    let n = 0;
    for (const pm of players.values()) {
      const b = pm.get(key);
      if (!b || b.hg > MAX_GOALS || b.ag > MAX_GOALS) continue;
      grid[b.hg * W + b.ag]++; n++;
    }
    if (n > 0) for (let o = 0; o < NOUT; o++) grid[o] /= n;
    return grid;
  });
  const betaGrid = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.4];
  const betaCorr: Record<string, number> = {};
  let bestBeta = 1.4, bestCorr = -Infinity;
  for (const beta of betaGrid) {
    const xs: number[] = [], ys: number[] = [];
    for (let g = 0; g < G; g++) {
      const pop = crowdPopularity(matrices[g], beta);
      for (let i = 0; i <= MAX_PICK; i++) for (let j = 0; j <= MAX_PICK; j++) { xs.push(pop[i][j]); ys.push(empByGame[g][i * W + j]); }
    }
    const c = pearson(xs, ys);
    betaCorr[beta.toFixed(1)] = c;
    if (c > bestCorr) { bestCorr = c; bestBeta = beta; }
  }

  // --- grade EPS × MIN_REL_GAP (β fixo no melhor) ---------------------------
  const epsGrid = [0.15, 0.3, 0.5];
  const gapGrid = [0.2, 0.3, 0.45];

  console.log(`Jogadores: ${players.size} (usuário=${userId}, adversários=${nOpp}) | jogos modelados: ${G} | K=${K}`);
  console.log("");
  console.log("β (correlação pop×freq real, objetivo sem resultado):");
  console.log("  " + betaGrid.map((b) => `${b.toFixed(1)}=${betaCorr[b.toFixed(1)].toFixed(3)}`).join("  "));
  console.log(`  → melhor β = ${bestBeta} (corr ${bestCorr.toFixed(3)})`);
  console.log("");

  const base = evalPicks(evPicks);
  const modalRes = evalPicks(modalPicks);
  console.log("Monte Carlo (E[pos] menor é melhor; P(top3)/P(1º) maior é melhor):");
  console.log("estratégia                 | jogos | EPcost | E[pts] | E[pos] | P(top3) | P(1º)");
  const fmt = (label: string, r: ReturnType<typeof evalPicks>, changed: number, epcost: number) =>
    `${label.padEnd(26)} | ${String(changed).padStart(5)} | ${epcost.toFixed(2).padStart(6)} | ${r.ePts.toFixed(1).padStart(6)} | ${r.eRank.toFixed(2).padStart(6)} | ${(r.pTop3 * 100).toFixed(1).padStart(6)}% | ${(r.pTop1 * 100).toFixed(1).padStart(4)}%`;
  console.log(fmt("MODAL", modalRes, G, 0));
  console.log(fmt("EV (base)", base, 0, 0));

  const rowsOut: { label: string; r: ReturnType<typeof evalPicks>; changed: number; epcost: number; eps: number; gap: number }[] = [];
  for (const eps of epsGrid) for (const gap of gapGrid) {
    let changed = 0, epcost = 0;
    const picks = matrices.map((m, g) => {
      const c = contrarianPick(m, { eps, minRelGap: gap, beta: bestBeta });
      if (c.ph !== c.evPh || c.pa !== c.evPa) { changed++; epcost += evEP[g] - c.ep; }
      return [c.ph, c.pa] as [number, number];
    });
    const r = evalPicks(picks);
    rowsOut.push({ label: `CONTRA eps=${eps} gap=${gap}`, r, changed, epcost, eps, gap });
  }
  rowsOut.sort((a, b) => b.r.pTop3 - a.r.pTop3 || a.r.eRank - b.r.eRank);
  for (const o of rowsOut) console.log(fmt(o.label, o.r, o.changed, o.epcost));

  const best = rowsOut[0];
  console.log("");
  console.log(`Sugestão (maior P(top3), depois menor E[pos]): ${best.label}`);
  console.log(`  vs EV: ΔP(top3)=${((best.r.pTop3 - base.pTop3) * 100).toFixed(2)}pp  ΔE[pos]=${(best.r.eRank - base.eRank).toFixed(2)}  custo EP=${best.epcost.toFixed(2)} em ${best.changed} jogos`);
  console.log(`  β sugerido = ${bestBeta}`);
}

main();
