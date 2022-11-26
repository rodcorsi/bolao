import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import getRanking, {
  MatchResult,
  Ranking,
  getMatchesOfDay,
} from "../lib/ranking";

import Footer from "../components/Footer";
import Head from "next/head";
import Link from "next/link";
import ListActiveMatches from "../components/ListActiveMatches";
import RankingList from "../components/RankingList";
import config from "../static_data/config.json";

const scorePoints = config.scorePoints;
const prize = config.prize;

const currencyFormat = new Intl.NumberFormat(config.locale, {
  style: "currency",
  currency: config.currency,
}).format;

function Home({
  ranking: { items, updateTime, lastPosition },
  activeMatches,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const totalGame = items.length * prize.GAME_VALUE + prize.BONUS;
  const firstPlace = totalGame * prize.FIRST_PLACE_PART;
  const secondPlace = totalGame * prize.SECOND_PLACE_PART;
  const thirdPlace = totalGame * prize.THIRD_PLACE_PART;
  return (
    <div className="md:mx-auto md:w-3/4">
      <Head>
        <title>Bolão Scheelita Copa 2022</title>
        <meta
          name="description"
          content="Pagina com resultados do bolão da scheelita copa 2022"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1 className="p-2 text-lg text-gray-700 font-bold">
        Bolão da Copa 2022 - Ranking Geral
      </h1>
      <main className="md:container">
        <ListActiveMatches
          className="grid sm:grid-cols-2 gap-2 mb-2"
          matches={activeMatches}
        />
        <div className="bg-white rounded-lg md:border border-gray-200">
          <RankingList rankingItems={items} lastPosition={lastPosition} />
        </div>
        <div className="px-2 font-bold text-sm text-gray-800">
          <div>{`Total de ${items.length} Jogos`}</div>
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
        <div className="text-sm text-right">
          <Link
            href="https://drive.google.com/file/d/10HK_51xsTPTfR0X-3fRDqofp-M432Zch/view?usp=share_link"
            target="_blank"
            className="text-blue-600 hover:underline"
          >
            Jogos Originais (Fase Grupos)🡕
          </Link>
        </div>
        <div className="text-xs text-right italic">
          A Classificação é atualizada com as partidas em andamento, portanto as
          posições podem ser alteradas durante o jogo
        </div>
        <div className="text-xs text-right italic">
          O tempo médio de atualização é de 15 minutos
        </div>
      </main>
      <Footer updateTime={updateTime} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<{
  ranking: Ranking;
  activeMatches: MatchResult[];
}> = async ({ res }) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=86400"
  );
  const ranking = await getRanking();
  const activeMatches = getMatchesOfDay(ranking.matches);
  // Pass data to the page via props
  return { props: { ranking, activeMatches } };
};

export default Home;
