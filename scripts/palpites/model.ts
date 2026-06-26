/**
 * Núcleo do modelo de placares (Copa do Mundo 2026) a partir de odds.
 *
 * Estratégia:
 *   - Totals (Over/Under)  -> μ = λ_casa + λ_visitante  (escala de gols)
 *   - H2H (1X2) + Spreads  -> s = λ_casa − λ_visitante   (supremacia)
 *   - λ_casa=(μ+s)/2, λ_visitante=(μ−s)/2
 *   - Matriz de placares Poisson + correção Dixon-Coles
 *   - Palpite escolhido por MAIOR PONTUAÇÃO ESPERADA sob a tabela do bolão
 *     (não pelo placar exato mais provável).
 *
 * Sem dependências externas. Importado por predict-scores.ts e backtest.ts.
 */

// ---------------------------------------------------------------------------
// Tipos da The Odds API
// ---------------------------------------------------------------------------
export interface Outcome {
  name: string;
  price: number;
  point?: number;
}
export interface Market {
  key: string;
  outcomes: Outcome[];
}
export interface Bookmaker {
  key: string;
  markets: Market[];
}
export interface Event {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

// ---------------------------------------------------------------------------
// Parâmetros do modelo
// ---------------------------------------------------------------------------
export const MAX_GOALS = 10; // trunca a matriz em 0..10 gols por time (cobre ~100% da massa)
export const RHO = -0.13; // correção Dixon-Coles (constante; ver Dixon & Coles 1997)
export const DEFAULT_MU = 2.6; // total de gols esperado quando não há mercado de totals
export const MAX_PICK = 6; // maior placar considerado como PALPITE (candidato)

/** Tabela de pontos do bolão (espelho de lib/calculatePoints.ts). */
export const SCORE_POINTS = {
  EXACT: 12,
  WINNER_AND_ONE_SCORE: 7,
  WINNER: 5,
  ONE_SCORE: 2,
} as const;

// ---------------------------------------------------------------------------
// Utilidades estatísticas
// ---------------------------------------------------------------------------
export function factorial(k: number): number {
  let r = 1;
  for (let i = 2; i <= k; i++) r *= i;
  return r;
}

export function poisson(k: number, lambda: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

export function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Remove a margem da casa: prob implícita 1/odd, normalizada para somar 1. */
export function devig(prices: number[]): number[] {
  const inv = prices.map((p) => 1 / p);
  const sum = inv.reduce((a, b) => a + b, 0);
  return inv.map((x) => x / sum);
}

// ---------------------------------------------------------------------------
// Matriz de placares (Poisson + Dixon-Coles)
// ---------------------------------------------------------------------------
export function dixonColesTau(i: number, j: number, lh: number, la: number, rho: number): number {
  if (i === 0 && j === 0) return 1 - lh * la * rho;
  if (i === 0 && j === 1) return 1 + lh * rho;
  if (i === 1 && j === 0) return 1 + la * rho;
  if (i === 1 && j === 1) return 1 - rho;
  return 1;
}

/** Matriz P[i][j] = P(casa faz i, visitante faz j), normalizada para somar 1. */
export function scoreMatrix(lh: number, la: number, rho = RHO): number[][] {
  const ph = Array.from({ length: MAX_GOALS + 1 }, (_, i) => poisson(i, lh));
  const pa = Array.from({ length: MAX_GOALS + 1 }, (_, j) => poisson(j, la));
  const m: number[][] = [];
  let total = 0;
  for (let i = 0; i <= MAX_GOALS; i++) {
    m[i] = [];
    for (let j = 0; j <= MAX_GOALS; j++) {
      const v = ph[i] * pa[j] * Math.max(0, dixonColesTau(i, j, lh, la, rho));
      m[i][j] = v;
      total += v;
    }
  }
  for (let i = 0; i <= MAX_GOALS; i++)
    for (let j = 0; j <= MAX_GOALS; j++) m[i][j] /= total;
  return m;
}

/** Converte (μ, s) em λ_casa, λ_visitante (sempre > 0). */
export function lambdas(mu: number, s: number): [number, number] {
  const lh = Math.max(0.02, (mu + s) / 2);
  const la = Math.max(0.02, (mu - s) / 2);
  return [lh, la];
}

// Probabilidades derivadas da matriz -------------------------------------------------
export function pHomeWin(m: number[][]): number {
  let p = 0;
  for (let i = 0; i <= MAX_GOALS; i++)
    for (let j = 0; j < i; j++) p += m[i][j];
  return p;
}
export function pAwayWin(m: number[][]): number {
  let p = 0;
  for (let i = 0; i <= MAX_GOALS; i++)
    for (let j = i + 1; j <= MAX_GOALS; j++) p += m[i][j];
  return p;
}

/** Distribuição da margem d = gols_casa − gols_visitante (índice deslocado). */
export function marginDist(m: number[][]): Map<number, number> {
  const dist = new Map<number, number>();
  for (let i = 0; i <= MAX_GOALS; i++)
    for (let j = 0; j <= MAX_GOALS; j++) {
      const d = i - j;
      dist.set(d, (dist.get(d) ?? 0) + m[i][j]);
    }
  return dist;
}

/** P(casa cobre o handicap asiático cujo home point = `point`). */
export function pHomeCover(m: number[][], point: number): number {
  const t = -point; // margem que a casa precisa superar
  const q = Math.round(t * 4) / 4; // arredonda para múltiplo de 0.25
  const frac = Math.abs(q % 1);
  // Linhas "quarter" (.25/.75): média das duas meias-linhas adjacentes.
  if (Math.abs(frac - 0.25) < 1e-9 || Math.abs(frac - 0.75) < 1e-9) {
    return 0.5 * (coverHalfOrInt(m, q - 0.25) + coverHalfOrInt(m, q + 0.25));
  }
  return coverHalfOrInt(m, q);
}

export function coverHalfOrInt(m: number[][], t: number): number {
  const dist = marginDist(m);
  let p = 0;
  for (const [d, prob] of dist) {
    if (d > t) p += prob;
    else if (Math.abs(d - t) < 1e-9) p += 0.5 * prob; // push conta metade
  }
  return p;
}

// ---------------------------------------------------------------------------
// Pontuação do bolão (decisão por pontos esperados)
// ---------------------------------------------------------------------------

/** Pontos do bolão para um palpite (ph,pa) contra o resultado real (a,b). */
export function pointsFor(ph: number, pa: number, a: number, b: number): number {
  if (ph === a && pa === b) return SCORE_POINTS.EXACT;
  const rightWinner = Math.sign(ph - pa) === Math.sign(a - b);
  const oneScore = ph === a || pa === b;
  if (rightWinner && oneScore) return SCORE_POINTS.WINNER_AND_ONE_SCORE;
  if (rightWinner) return SCORE_POINTS.WINNER;
  if (oneScore) return SCORE_POINTS.ONE_SCORE;
  return 0;
}

/** Pontos esperados de um palpite (ph,pa) dada a distribuição verdadeira `m`. */
export function expectedPoints(m: number[][], ph: number, pa: number): number {
  let ep = 0;
  for (let a = 0; a <= MAX_GOALS; a++)
    for (let b = 0; b <= MAX_GOALS; b++) {
      const prob = m[a][b];
      if (prob === 0) continue;
      ep += prob * pointsFor(ph, pa, a, b);
    }
  return ep;
}

/**
 * Palpite que MAXIMIZA os pontos esperados, varrendo candidatos 0..MAX_PICK.
 * Retorna o placar, os pontos esperados e a probabilidade exata daquele placar.
 */
export function expectedPointsPick(m: number[][]): { ph: number; pa: number; ep: number; prob: number } {
  let best = { ph: 0, pa: 0, ep: -1, prob: 0 };
  for (let ph = 0; ph <= MAX_PICK; ph++)
    for (let pa = 0; pa <= MAX_PICK; pa++) {
      const ep = expectedPoints(m, ph, pa);
      if (ep > best.ep) best = { ph, pa, ep, prob: m[ph]?.[pa] ?? 0 };
    }
  return best;
}

/** Placar exato mais provável (regra antiga: argmax P). */
export function modalPick(m: number[][]): { ph: number; pa: number; prob: number } {
  let best = { ph: 0, pa: 0, prob: -1 };
  for (let i = 0; i <= MAX_GOALS; i++)
    for (let j = 0; j <= MAX_GOALS; j++)
      if (m[i][j] > best.prob) best = { ph: i, pa: j, prob: m[i][j] };
  return best;
}

// ---------------------------------------------------------------------------
// Modelo de multidão + desempate anti-multidão (teoria dos jogos)
// ---------------------------------------------------------------------------

/** Concentração da multidão vs probabilidade real (calibrável; ver rank-backtest). */
export const BETA = 1.4;
/**
 * Folga de pontos esperados aceita para diferenciar do consenso.
 *
 * NOTA (validado por Monte Carlo em tune.ts): contrarianismo = variância, que só
 * ajuda o RANK quando você está ATRÁS. Com o modelo EV o usuário entra como
 * favorito do campo (P(top-3)≈45%), então divergir do EV REDUZ P(top-3). Por
 * isso os defaults deixam o contrário praticamente desligado (muda ~1 jogo ≈ EV).
 * Se um dia estiver atrás num pelotão apertado, afrouxe EPS e MIN_REL_GAP.
 */
export const EPS = 0.15;
/**
 * Só diverge do EV se a popularidade cair bastante: o palpite contrário precisa
 * ser ao menos `MIN_REL_GAP` menos apostado que o do EV (0.45 = 45% menos).
 */
export const MIN_REL_GAP = 0.45;

/**
 * Reforço para placares "redondos"/comuns que a torcida superaposta além do que
 * a probabilidade justificaria. Multiplicativo sobre P^β.
 */
export const COMMON_SCORE_BOOST: Record<string, number> = {
  "1-0": 1.3,
  "0-1": 1.2,
  "2-0": 1.2,
  "0-2": 1.15,
  "2-1": 1.25,
  "1-2": 1.15,
  "1-1": 1.3,
  "0-0": 1.2,
  "3-0": 1.1,
  "0-3": 1.05,
  "3-1": 1.05,
  "1-3": 1.05,
};

/**
 * Popularidade estimada de cada placar entre a multidão (amadores), modelada a
 * partir das odds: pop(i,j) ∝ P(i,j)^β · boost(i,j). Normalizada em 0..MAX_PICK.
 */
export function crowdPopularity(m: number[][], beta = BETA): number[][] {
  const pop: number[][] = [];
  let total = 0;
  for (let i = 0; i <= MAX_PICK; i++) {
    pop[i] = [];
    for (let j = 0; j <= MAX_PICK; j++) {
      const boost = COMMON_SCORE_BOOST[`${i}-${j}`] ?? 1;
      const v = Math.pow(m[i]?.[j] ?? 0, beta) * boost;
      pop[i][j] = v;
      total += v;
    }
  }
  for (let i = 0; i <= MAX_PICK; i++)
    for (let j = 0; j <= MAX_PICK; j++) pop[i][j] = total > 0 ? pop[i][j] / total : 0;
  return pop;
}

export interface ContrarianResult {
  ph: number; // palpite contrário (menos apostado entre os ~EV-ótimos)
  pa: number;
  ep: number; // pontos esperados do palpite contrário
  pop: number; // popularidade (fração estimada da multidão) do palpite contrário
  evPh: number; // palpite EV-ótimo (referência)
  evPa: number;
  evEp: number;
  evPop: number; // popularidade do palpite EV-ótimo
  costEp: number; // custo em pontos esperados (= evEp − ep), ≤ eps
}

/**
 * Entre os palpites com EP a no máximo `eps` do ótimo, escolhe o MENOS apostado
 * pela multidão. Diferenciação barata: custo de EP limitado por `eps`.
 */
export function contrarianPick(
  m: number[][],
  opts: { eps?: number; beta?: number; minRelGap?: number } = {},
): ContrarianResult {
  const eps = opts.eps ?? EPS;
  const minRelGap = opts.minRelGap ?? MIN_REL_GAP;
  const pop = crowdPopularity(m, opts.beta);
  const ev = expectedPointsPick(m);
  const evPop = pop[ev.ph]?.[ev.pa] ?? 0;
  // menos apostado entre os candidatos a no máximo `eps` do EV-ótimo
  let cand = { ph: ev.ph, pa: ev.pa, ep: ev.ep, pop: evPop };
  for (let i = 0; i <= MAX_PICK; i++)
    for (let j = 0; j <= MAX_PICK; j++) {
      const ep = expectedPoints(m, i, j);
      if (ep >= ev.ep - eps && pop[i][j] < cand.pop) cand = { ph: i, pa: j, ep, pop: pop[i][j] };
    }
  // só diverge se a diferenciação for relevante (queda mínima de popularidade)
  const worth = cand.pop <= evPop * (1 - minRelGap);
  const best = worth ? cand : { ph: ev.ph, pa: ev.pa, ep: ev.ep, pop: evPop };
  return {
    ph: best.ph,
    pa: best.pa,
    ep: best.ep,
    pop: best.pop,
    evPh: ev.ph,
    evPa: ev.pa,
    evEp: ev.ep,
    evPop,
    costEp: ev.ep - best.ep,
  };
}

// ---------------------------------------------------------------------------
// Solvers (bisseção)
// ---------------------------------------------------------------------------

/** Resolve μ tal que P(total > linha) = pOver, sob total ~ Poisson(μ). */
export function solveMu(pOver: number, line: number): number {
  // P(total > line); para line=2.5 -> P(total>=3) = 1 - P(0)-P(1)-P(2)
  const overProb = (mu: number) => {
    const kMax = Math.floor(line); // maior total que NÃO supera a linha
    let under = 0;
    for (let k = 0; k <= kMax; k++) under += poisson(k, mu);
    // linha inteira (ex.: 2.0): empate na linha é push -> conta metade
    if (Math.abs(line - Math.round(line)) < 1e-9) under -= 0.5 * poisson(line, mu);
    return 1 - under;
  };
  return bisect((mu) => overProb(mu) - pOver, 0.1, 8, 1e-6);
}

/** Resolve s para casar uma probabilidade-alvo derivada da matriz. */
export function solveS(mu: number, target: number, quantity: (m: number[][]) => number): number {
  return bisect(
    (s) => {
      const [lh, la] = lambdas(mu, s);
      return quantity(scoreMatrix(lh, la)) - target;
    },
    -mu + 0.04,
    mu - 0.04,
    1e-5,
  );
}

export function bisect(f: (x: number) => number, lo: number, hi: number, tol: number): number {
  let flo = f(lo);
  let fhi = f(hi);
  if (flo === 0) return lo;
  if (fhi === 0) return hi;
  if (flo * fhi > 0) return Math.abs(flo) < Math.abs(fhi) ? lo : hi; // sem raiz no intervalo: usa extremo mais próximo
  for (let it = 0; it < 80; it++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < tol || hi - lo < tol) return mid;
    if (flo * fm < 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// Extração dos sinais de mercado a partir das casas
// ---------------------------------------------------------------------------

/**
 * Casas "sharp" (precificação mais próxima da probabilidade real). Quando o
 * evento tem alguma delas, restringimos os consensos a essas casas; caso
 * contrário caímos para todas as casas disponíveis.
 */
export const SHARP_BOOKS = new Set([
  "pinnacle",
  "betfair_ex_eu",
  "betfair_ex_uk",
  "betfair",
  "betclic",
  "matchbook",
  "smarkets",
]);

/** Devolve as casas sharp do evento; se não houver, todas as casas. */
export function selectBooks(ev: Event): Bookmaker[] {
  const sharp = ev.bookmakers.filter((b) => SHARP_BOOKS.has(b.key));
  return sharp.length ? sharp : ev.bookmakers;
}

/** Consenso H2H: probabilidades de-vigadas (mediana entre casas), renormalizadas. */
export function consensusH2H(ev: Event): { pHome: number; pAway: number } | null {
  const phs: number[] = [];
  const pds: number[] = [];
  const pas: number[] = [];
  for (const bk of selectBooks(ev)) {
    const m = bk.markets.find((x) => x.key === "h2h");
    if (!m) continue;
    const home = m.outcomes.find((o) => o.name === ev.home_team)?.price;
    const away = m.outcomes.find((o) => o.name === ev.away_team)?.price;
    const draw = m.outcomes.find((o) => o.name === "Draw")?.price;
    if (!home || !away || !draw) continue;
    const [ph, pd, pa] = devig([home, draw, away]);
    phs.push(ph);
    pds.push(pd);
    pas.push(pa);
  }
  if (phs.length === 0) return null;
  // medianas independentes podem não somar 1: renormaliza para um trio coerente.
  const mh = median(phs);
  const md = median(pds);
  const ma = median(pas);
  const sum = mh + md + ma;
  return { pHome: mh / sum, pAway: ma / sum };
}

/** Consenso Totals: μ por casa (a partir da sua linha/preço) -> mediana de μ. */
export function consensusMu(ev: Event): number | null {
  const mus: number[] = [];
  for (const bk of selectBooks(ev)) {
    const m = bk.markets.find((x) => x.key === "totals");
    if (!m) continue;
    const over = m.outcomes.find((o) => o.name === "Over");
    const under = m.outcomes.find((o) => o.name === "Under");
    if (!over || !under || over.point == null) continue;
    const [pOver] = devig([over.price, under.price]);
    mus.push(solveMu(pOver, over.point));
  }
  if (mus.length === 0) return null;
  return median(mus);
}

/** Consenso Spreads: P(casa cobre) por linha de handicap (mediana entre casas). */
export function consensusSpreads(ev: Event): { point: number; pCover: number }[] {
  const byPoint = new Map<number, number[]>();
  for (const bk of selectBooks(ev)) {
    const m = bk.markets.find((x) => x.key === "spreads");
    if (!m) continue;
    const home = m.outcomes.find((o) => o.name === ev.home_team);
    const away = m.outcomes.find((o) => o.name === ev.away_team);
    if (!home || !away || home.point == null) continue;
    const [pHomeCover] = devig([home.price, away.price]);
    const arr = byPoint.get(home.point) ?? [];
    arr.push(pHomeCover);
    byPoint.set(home.point, arr);
  }
  return [...byPoint.entries()].map(([point, ps]) => ({ point, pCover: median(ps) }));
}

// ---------------------------------------------------------------------------
// Cálculo por jogo
// ---------------------------------------------------------------------------
export interface Prediction {
  ev: Event;
  mu: number;
  s: number;
  lh: number;
  la: number;
  ph: number; // palpite casa (E[pontos]-ótimo)
  pa: number; // palpite visitante
  ep: number; // pontos esperados do palpite
  prob: number; // probabilidade do placar palpitado
}

/** Estima (μ, s) e os λ de um evento a partir dos mercados. */
export function fitLambdas(ev: Event): { mu: number; s: number; lh: number; la: number } {
  const mu = consensusMu(ev) ?? DEFAULT_MU;

  const sEstimates: number[] = [];
  const h2h = consensusH2H(ev);
  if (h2h) {
    const sH2H = solveS(mu, h2h.pHome - h2h.pAway, (m) => pHomeWin(m) - pAwayWin(m));
    sEstimates.push(sH2H);
  }

  // consenso de spreads: uma única estimativa (mediana das linhas) para não
  // afogar o sinal de H2H quando há muitas linhas de handicap.
  const spreadSs = consensusSpreads(ev).map((line) =>
    solveS(mu, line.pCover, (m) => pHomeCover(m, line.point)),
  );
  if (spreadSs.length) sEstimates.push(median(spreadSs));

  const s = sEstimates.length ? sEstimates.reduce((a, b) => a + b, 0) / sEstimates.length : 0;
  const [lh, la] = lambdas(mu, s);
  return { mu, s, lh, la };
}

export function predict(ev: Event): Prediction {
  const { mu, s, lh, la } = fitLambdas(ev);
  const m = scoreMatrix(lh, la);
  const pick = expectedPointsPick(m);
  return { ev, mu, s, lh, la, ph: pick.ph, pa: pick.pa, ep: pick.ep, prob: pick.prob };
}
