import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import getRanking, {
  MatchResult,
  Ranking,
  RankingItem,
  bestRankingForMatches,
  getMatchesOfDay,
} from "../lib/ranking";

import ExternalLink from "../components/ExternalLink";
import Footer from "../components/Footer";
import Head from "next/head";
import Link from "next/link";
import ListActiveMatches from "../components/ListActiveMatches";
import ListBestPlayers from "../components/ListBestPlayers";
import RankingList from "../components/RankingList";
import { getConfig, Config } from "../lib/getConfig";

const MAX_ITEMS_BEST_OF_DAY = 5;

function Home({
  ranking: { items, updateTime, expire, lastPosition },
  matchesOfDay,
  bestOfDay,
  config,
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
        <title>Bolão Scheelita Copa 2022</title>
        <meta
          name="description"
          content="Pagina com resultados do bolão da scheelita copa 2022"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="md:container">
        <div>
          <h1 className="p-2 text-xl text-gray-700 font-bold">
            Parabéns aos vencedores!!
          </h1>
          <div className="grid sm:grid-cols-2 gap-2 mb-2">
            <div className="border border-gray-300 p-2 rounded-md shadow-md">
              <div className="font-bold text-lg text-gray-700">
                🥇🥉Carlos Nascimento
              </div>
              <img
                className="mx-auto"
                width={175}
                height={305}
                src="images/pix-carlos.jpeg"
              ></img>
            </div>
            <div className="border border-gray-300 p-2 rounded-md shadow-md">
              <div className="font-bold text-lg text-gray-700">🥈Rubens</div>
              <img
                className="mx-auto"
                width={175}
                height={305}
                src="images/pix-rubens.jpeg"
              ></img>
            </div>
          </div>
        </div>
        <h2 className="p-2 text-lg text-gray-700 font-bold">
          Bolão da Copa 2022 - Ranking Geral
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
        <div className="p-2">
          {`A premiação é calculada sobre o valor total arrecadado (R$ ${prize.GAME_VALUE} por jogo) + bônus de ${currencyFormat(prize.BONUS)}.`}
        </div>
        <div className="p-2">
          {`Maiores informações e regras no link: `}
          <ExternalLink href="https://docs.google.com/document/d/1X6Gq8_0G8x3_t8J1kZ_1Z8x_y8_1_z_1_y_1_x_1_w/edit?usp=sharing">
            Regulamento
          </ExternalLink>
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
  // Pass data to the page via props
  return { props: { ranking, matchesOfDay, bestOfDay, config } };
};

export default Home;
