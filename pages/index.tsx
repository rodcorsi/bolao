import { Config, getConfig } from "../lib/getConfig";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import getRanking, {
  MatchResult,
  Ranking,
  RankingItem,
  bestRankingForMatches,
  getMatchesOfDay,
} from "../lib/ranking";

import Footer from "../components/Footer";
import Head from "next/head";
import Link from "next/link";
import ListActiveMatches from "../components/ListActiveMatches";
import ListBestPlayers from "../components/ListBestPlayers";
import { PhaseState } from "../lib/tournamentPhase";
import PhaseStatusCard from "../components/PhaseStatusCard";
import RankingList from "../components/RankingList";
import { getPhaseState } from "../lib/phaseState";

const MAX_ITEMS_BEST_OF_DAY = 5;

function Home({
  ranking: { items, updateTime, expire, lastPosition },
  matchesOfDay,
  bestOfDay,
  config,
  phaseState,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { prize, scorePoints, locale, currency } = config;

  const currencyFormat = (val: number) => new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(val);

  const totalGame = items.length * prize.GAME_VALUE + prize.BONUS;
  const firstPlace = totalGame * prize.FIRST_PLACE_PART;
  const secondPlace = totalGame * prize.SECOND_PLACE_PART;
  const thirdPlace = totalGame * prize.THIRD_PLACE_PART;

  return (
    <div className="md:mx-auto md:w-3/4">
      <Head>
        <title>{config.tournament.title}</title>
        <meta
          name="description"
          content={`Acompanhe o ranking e as fases de ${config.tournament.title}`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="md:container">
        <h1 className="p-2 text-2xl text-gray-800 font-bold">
          {config.tournament.title}
        </h1>
        <PhaseStatusCard phaseState={phaseState} config={config} />
        <h2 className="p-2 text-lg text-gray-700 font-bold">
          Ranking geral
        </h2>
        <ListActiveMatches
          className="grid sm:grid-cols-2 gap-2 mb-2"
          matches={matchesOfDay}
        />
        <ListBestPlayers rankingItems={bestOfDay} />
        <div className="bg-white rounded-lg md:border border-gray-200">
          <RankingList
            rankingItems={items}
            lastPosition={lastPosition}
            scorePoints={scorePoints}
          />
        </div>
        <div className="px-2 pt-4 font-bold text-sm text-gray-800">
          <div>{`Total de ${items.length} jogadores`}</div>
          <div>{`Premiação Total ${currencyFormat(
            totalGame
          )} a ser divida entre ganhadores`}</div>
          <div>{`🥇 1º - ${currencyFormat(firstPlace)}`}</div>
          <div>{`🥈 2º - ${currencyFormat(secondPlace)}`}</div>
          <div>{`🥉 3º - ${currencyFormat(thirdPlace)}`}</div>
          <div>{`🍍 Último - Muito obrigado continue assim 😉`}</div>
        </div>
        <ul className="px-2 pt-2 text-xs text-gray-800">
          <li>{`*Q${scorePoints.EXACT}: Quantidade de ${scorePoints.EXACT} pontos, atingido quando se acerta o placar exato`}</li>
          <li>{`*Q${scorePoints.WINNER_AND_ONE_SCORE}: Quantidade de ${scorePoints.WINNER_AND_ONE_SCORE} pontos, atingido quando se acerta o vencedor e um placar`}</li>
          <li>{`*Q${scorePoints.WINNER}: Quantidade de ${scorePoints.WINNER} pontos, atingido quando se acerta somente o vencedor`}</li>
          <li>{`*Q${scorePoints.ONE_SCORE}: Quantidade de ${scorePoints.ONE_SCORE} pontos, atingido quando se acerta um placar`}</li>
        </ul>
        <div className="p-2">
          {`A premiação é calculada sobre o valor total arrecadado (R$ ${prize.GAME_VALUE} por jogo) + bônus de ${currencyFormat(prize.BONUS)}.`}
        </div>
        <div className="p-2">
          {`Maiores informações leia o `}
          <Link href="/rules" className="text-blue-600 hover:underline">
            Regulamento
          </Link>
        </div>
      </main>
      <Footer updateTime={updateTime} expire={expire} config={config} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<{
  ranking: Ranking;
  matchesOfDay: MatchResult[];
  bestOfDay: RankingItem[];
  config: Config;
  phaseState: PhaseState;
}> = async ({ res }) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=86400"
  );
  const [ranking, config] = await Promise.all([getRanking(), getConfig()]);
  const matchesOfDay = getMatchesOfDay(ranking.matches);
  const bestOfDay = bestRankingForMatches(
    matchesOfDay,
    ranking.items,
    MAX_ITEMS_BEST_OF_DAY,
    config.scorePoints
  );
  const phaseState = getPhaseState(config, ranking.matches);
  // Pass data to the page via props
  return { props: { ranking, matchesOfDay, bestOfDay, config, phaseState } };
};

export default Home;
