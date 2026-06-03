import { Config } from "../../lib/getConfig";
import Footer from "../Footer";
import { buildPrizeSummary, getTopPrize } from "../../lib/prize";
import Link from "next/link";
import React from "react";
import { MatchResult, RankingItem } from "../../lib/ranking";
import { PhaseState } from "../../lib/tournamentPhase";
import { formatDateTime } from "../../lib/formatDate";
import { getPlayerDisplayName } from "../../lib/playerDisplayName";
import { selectGoals } from "../../lib/getFootballFixture";

interface HomeLandingProps {
  allMatches: MatchResult[];
  bestOfDay: RankingItem[];
  config: Config;
  matchesOfDay: MatchResult[];
  participantCount: number;
  phaseState: PhaseState;
  rankingItems: RankingItem[];
}

const HomeLanding: React.FC<HomeLandingProps> = ({
  allMatches,
  bestOfDay,
  config,
  matchesOfDay,
  participantCount,
  phaseState,
  rankingItems,
}) => {
  const canSignup = phaseState.currentPhase === "INICIO";
  const primaryHref = canSignup ? "/signup" : "/play";
  const primaryLabel = canSignup ? "Entrar no bolão" : "Abrir minha sessão";
  const currencyFormat = (value: number) =>
    new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
    }).format(value);
  const prizeSummary = buildPrizeSummary({
    config,
    matches: allMatches,
    rankingItems,
  });
  const generalTopPrize = getTopPrize(prizeSummary.general);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.25),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_24%),linear-gradient(180deg,_#f8fffc_0%,_#eef7ff_52%,_#f7f7ef_100%)] text-slate-900">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 p-5 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">
                Copa 2026 • Bolão em andamento
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black leading-none tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  O bolão que transforma cada rodada em assunto de mesa, grupo e madrugada.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
                  Entre no {config.tournament.title}, monte seu jogo, acompanhe o ranking ao vivo e dispute prêmios na classificação geral e em duas etapas da Copa.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {primaryLabel}
                </Link>
                <Link
                  href="/play"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
                >
                  Já tenho cadastro
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Participantes" value={String(participantCount)} hint="Cada novo jogo aumenta a disputa." />
                <StatCard
                  label="Prêmio do 1º geral"
                  value={currencyFormat(generalTopPrize?.amount || 0)}
                  hint="Metade do caixa vai para o ranking acumulado."
                />
                <StatCard
                  label="Fase atual"
                  value={phaseState.currentPhaseLabel}
                  hint={
                    phaseState.editablePhaseLabel
                      ? `Palpites abertos para ${phaseState.editablePhaseLabel}.`
                      : "Janela de palpites fechada no momento."
                  }
                />
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.9)]">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Radar da rodada
                </div>
                <div className="mt-3 text-2xl font-bold">
                  {phaseState.editablePhaseLabel || phaseState.currentPhaseLabel}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {phaseState.editablePhaseLockAt
                    ? `Prazo desta janela: ${formatDateTime(
                        phaseState.editablePhaseLockAt,
                        config.locale,
                        config.timeZone
                      )}.`
                    : "O ranking segue aberto para consulta e comparação."}
                </p>
                <div className="mt-5 grid gap-3">
                  <MiniInfo
                    title="Como funciona"
                    text="Crie sua conta, escolha seu jogador principal e registre seus placares antes de cada corte."
                  />
                  <MiniInfo
                    title="Pontuação"
                    text={`Até ${config.scorePoints.EXACT} pontos por jogo, com bônus para vencedor e acerto parcial.`}
                  />
                  <MiniInfo
                    title="Três rankings premiados"
                    text="O caixa é dividido entre o ranking Geral, a Fase de Grupos e as Finais. Cada etapa possui placar próprio e premia o pódio completo."
                  />
                  <MiniInfo
                    title="Acesso rápido"
                    text="Abra a sessão quando quiser revisar palpites, criar novos jogadores ou acompanhar seu desempenho."
                  />
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white/85 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Próxima emoção
                </div>
                {matchesOfDay.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {matchesOfDay.slice(0, 2).map((match) => {
                      const goals = selectGoals(match.fixture);
                      return (
                        <div
                          key={match.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                            <span className="truncate">{match.homeTeam}</span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                              {goals.homeTeam != null && goals.awayTeam != null
                                ? `${goals.homeTeam} x ${goals.awayTeam}`
                                : "vs"}
                            </span>
                            <span className="truncate text-right">{match.awayTeam}</span>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            {formatDateTime(match.fixture.utcDate, config.locale, config.timeZone)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    Nenhum jogo marcado para hoje. Bom momento para entrar, estudar a tabela e preparar seus palpites.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Por que entrar agora
            </div>
            <div className="mt-4 grid gap-4">
              <FeatureCard
                title="Palpites fase a fase"
                text="O jogo muda junto com a Copa. Cada janela abre novos confrontos e novas decisões."
              />
              <FeatureCard
                title="Ranking em tempo real"
                text="Acompanhe os pontos, subidas e empates conforme os resultados entram."
              />
              <FeatureCard
                title="Prêmios por etapa"
                text="Grupos e finais pagam blocos próprios, sempre premiando 1º, 2º e 3º lugares."
              />
              <FeatureCard
                title="Mais de um jogador"
                text="Crie estratégias diferentes sob a mesma conta e compare seu próprio desempenho."
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_25px_70px_-45px_rgba(15,23,42,0.9)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                  Pulso do bolão
                </div>
                <h2 className="mt-2 text-2xl font-bold">Quem está brilhando hoje</h2>
              </div>
              <div className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">
                Atualizado continuamente
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {bestOfDay.slice(0, 5).map((item, index) => (
                <div
                  key={item.player.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">
                      {getPlayerDisplayName(item.player)}
                    </div>
                    <div className="text-sm text-slate-300">
                      {item.points} pontos totais
                    </div>
                  </div>
                  <Link
                    href={`/players/${item.player.id}`}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    Ver
                  </Link>
                </div>
              ))}
              {bestOfDay.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 px-4 py-6 text-sm text-slate-300">
                  O placar do dia ainda está vazio. Seja um dos primeiros a marcar presença.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Entrada liberada
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Monte seu placar antes da próxima virada da tabela.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Quanto antes você entrar, mais oportunidades terá para abrir distância no ranking e testar estratégias diferentes.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {primaryLabel}
              </Link>
              <Link
                href="/rules"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400"
              >
                Ler regulamento
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" />
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; hint: string }> = ({
  hint,
  label,
  value,
}) => (
  <div className="rounded-[1.25rem] border border-slate-200 bg-white/85 p-4">
    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
      {label}
    </div>
    <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">
      {value}
    </div>
    <div className="mt-2 text-sm leading-6 text-slate-600">{hint}</div>
  </div>
);

const FeatureCard: React.FC<{ title: string; text: string }> = ({ text, title }) => (
  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
    <div className="text-lg font-bold text-slate-900">{title}</div>
    <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
  </div>
);

const MiniInfo: React.FC<{ title: string; text: string }> = ({ text, title }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
    <div className="font-semibold text-white">{title}</div>
    <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
  </div>
);

export default HomeLanding;
