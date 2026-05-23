import { Config } from "../../lib/getConfig";
import Footer from "../Footer";
import Link from "next/link";
import ListActiveMatches from "../ListActiveMatches";
import ListBestPlayers from "../ListBestPlayers";
import PhaseStatusCard from "../PhaseStatusCard";
import RankingList from "../RankingList";
import React from "react";
import { MatchResult, RankingItem } from "../../lib/ranking";
import { PhaseState } from "../../lib/tournamentPhase";

interface HomeDashboardProps {
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

  const totalGame = items.length * prize.GAME_VALUE + prize.BONUS;
  const firstPlace = totalGame * prize.FIRST_PLACE_PART;
  const secondPlace = totalGame * prize.SECOND_PLACE_PART;
  const thirdPlace = totalGame * prize.THIRD_PLACE_PART;

  return (
    <div className="md:mx-auto md:w-3/4">
      <main className="md:container">
        <h1 className="p-2 text-2xl font-bold text-gray-800">
          {config.tournament.title}
        </h1>
        <PhaseStatusCard phaseState={phaseState} config={config} />
        <h2 className="p-2 text-lg font-bold text-gray-700">Ranking geral</h2>
        <ListActiveMatches
          className="mb-2 grid gap-2 sm:grid-cols-2"
          matches={matchesOfDay}
        />
        <ListBestPlayers rankingItems={bestOfDay} />
        <div className="rounded-lg bg-white md:border md:border-gray-200">
          <RankingList
            rankingItems={items}
            lastPosition={lastPosition}
            scorePoints={scorePoints}
          />
        </div>
        <div className="px-2 pt-4 text-sm font-bold text-gray-800">
          <div>{`Total de ${items.length} jogadores`}</div>
          <div>{`Premiacao Total ${currencyFormat(
            totalGame
          )} a ser divida entre ganhadores`}</div>
          <div>{`1o - ${currencyFormat(firstPlace)}`}</div>
          <div>{`2o - ${currencyFormat(secondPlace)}`}</div>
          <div>{`3o - ${currencyFormat(thirdPlace)}`}</div>
          <div>{`Ultimo - Muito obrigado continue assim`}</div>
        </div>
        <ul className="px-2 pt-2 text-xs text-gray-800">
          <li>{`*Q${scorePoints.EXACT}: Quantidade de ${scorePoints.EXACT} pontos, atingido quando se acerta o placar exato`}</li>
          <li>{`*Q${scorePoints.WINNER_AND_ONE_SCORE}: Quantidade de ${scorePoints.WINNER_AND_ONE_SCORE} pontos, atingido quando se acerta o vencedor e um placar`}</li>
          <li>{`*Q${scorePoints.WINNER}: Quantidade de ${scorePoints.WINNER} pontos, atingido quando se acerta somente o vencedor`}</li>
          <li>{`*Q${scorePoints.ONE_SCORE}: Quantidade de ${scorePoints.ONE_SCORE} pontos, atingido quando se acerta um placar`}</li>
        </ul>
        <div className="p-2">
          {`A premiacao e calculada sobre o valor total arrecadado (R$ ${prize.GAME_VALUE} por jogo) + bonus de ${currencyFormat(prize.BONUS)}.`}
        </div>
        <div className="p-2">
          {`Maiores informacoes leia o `}
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
