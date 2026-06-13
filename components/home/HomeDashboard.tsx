import { MatchResult, RankingItem } from "../../lib/ranking";

import { Config } from "../../lib/getConfig";
import Footer from "../Footer";
import Link from "next/link";
import ListActiveMatches from "../ListActiveMatches";
import ListBestPlayers from "../ListBestPlayers";
import { PhaseState } from "../../lib/tournamentPhase";
import PhaseStatusCard from "../PhaseStatusCard";
import RankingList from "../RankingList";
import React from "react";
import { buildPrizeSummary } from "../../lib/prize";

interface HomeDashboardProps {
  allMatches: MatchResult[];
  bestOfDay: RankingItem[];
  config: Config;
  expire: number;
  items: RankingItem[];
  lastPosition: number;
  matchesOfDay: MatchResult[];
  phaseState: PhaseState;
  updateTime: string;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({
  allMatches,
  bestOfDay,
  config,
  expire,
  items,
  lastPosition,
  matchesOfDay,
  phaseState,
  updateTime,
}) => {
  const { prize, scorePoints, locale, currency } = config;
  const currencyFormat = (val: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(val);

  const prizeSummary = buildPrizeSummary({
    config,
    matches: allMatches,
    rankingItems: items,
  });

  return (
    <div className="md:mx-auto md:w-3/4">
      <main className="md:container">
        <h1 className="p-2 text-2xl font-bold text-gray-800">
          {config.tournament.title}
        </h1>
        <PhaseStatusCard
          phaseState={phaseState}
          config={config}
          isAuthenticated
        />
        <ListActiveMatches
          className="mb-2 grid gap-2 sm:grid-cols-2"
          matches={matchesOfDay}
        />
        <ListBestPlayers rankingItems={bestOfDay} />
        <h2 className="p-2 text-lg font-bold text-gray-700">Ranking geral</h2>
        <div className="rounded-lg bg-white md:border md:border-gray-200">
          <RankingList
            rankingItems={items}
            lastPosition={lastPosition}
            scorePoints={scorePoints}
          />
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Premiação do bolão
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {`Caixa atual de ${currencyFormat(prizeSummary.totalPool)} com prêmios para a classificação geral e duas etapas específicas (Fase de Grupos e Finais).`}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <PrizeCard
              title="Geral"
              subtitle={`${Math.round(prizeSummary.general.poolPart * 100)}% do caixa`}
              amount={currencyFormat(prizeSummary.general.poolAmount)}
              winners={prizeSummary.general.winners.map((winner) => ({
                label: `${winner.position}º lugar`,
                amount: currencyFormat(winner.amount),
              }))}
            />
            {prizeSummary.phases.map((phase) => (
              <PrizeCard
                key={phase.key}
                title={phase.label}
                subtitle={`${Math.round(phase.poolPart * 100)}% do caixa`}
                amount={currencyFormat(phase.poolAmount)}
                winners={phase.winners.map((winner) => ({
                  label: `${winner.position}º lugar`,
                  amount: currencyFormat(winner.amount),
                }))}
              />
            ))}
          </div>
        </div>
        <ul className="px-2 pt-2 text-xs text-gray-800">
          <li>{`*Q${scorePoints.EXACT}: quantidade de jogos com ${scorePoints.EXACT} pontos, quando se acerta o placar exato.`}</li>
          <li>{`*Q${scorePoints.WINNER_AND_ONE_SCORE}: quantidade de jogos com ${scorePoints.WINNER_AND_ONE_SCORE} pontos, quando se acerta o vencedor e um placar.`}</li>
          <li>{`*Q${scorePoints.WINNER}: quantidade de jogos com ${scorePoints.WINNER} pontos, quando se acerta somente o vencedor.`}</li>
          <li>{`*Q${scorePoints.ONE_SCORE}: quantidade de jogos com ${scorePoints.ONE_SCORE} pontos, quando se acerta um placar.`}</li>
        </ul>
        <div className="p-2">
          {`A premiação é calculada sobre o valor total arrecadado (R$ ${prize.GAME_VALUE} por jogo) + bônus de ${currencyFormat(prize.BONUS)}.`}
        </div>
        <div className="p-2">
          {`Para mais informações, leia o `}
          <Link href="/rules" className="text-blue-600 hover:underline">
            Regulamento
          </Link>
        </div>
      </main>
      <Footer updateTime={updateTime} expire={expire} config={config} />
    </div>
  );
};

export default HomeDashboard;

const PrizeCard: React.FC<{
  amount: string;
  subtitle: string;
  title: string;
  winners: Array<{ label: string; amount: string }>;
}> = ({ amount, subtitle, title, winners }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
      {title}
    </div>
    <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    <div className="mt-3 text-2xl font-black text-slate-950">{amount}</div>
    <div className="mt-3 space-y-1 text-sm text-slate-700">
      {winners.map((winner) => (
        <div
          key={winner.label}
          className="flex items-center justify-between gap-3"
        >
          <span>{winner.label}</span>
          <span className="font-semibold">{winner.amount}</span>
        </div>
      ))}
    </div>
  </div>
);
