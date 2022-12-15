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
import config from "../static_data/config.json";

const scorePoints = config.scorePoints;
const prize = config.prize;

const currencyFormat = new Intl.NumberFormat(config.locale, {
  style: "currency",
  currency: config.currency,
}).format;

function Home({
  ranking: { items, updateTime, expire, lastPosition },
  matchesOfDay,
  bestOfDay,
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
          matches={matchesOfDay}
        />
        <ListBestPlayers rankingItems={bestOfDay} />
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
        <div className="text-sm text-right mb-2">
          <div className="font-bold">Jogos Originais</div>
          <ExternalLink href="https://drive.google.com/file/d/10HK_51xsTPTfR0X-3fRDqofp-M432Zch/view?usp=share_link">
            Fase de Grupos
          </ExternalLink>
          <ExternalLink href="https://drive.google.com/file/d/1d_gIKSxqr1RO3_-pzjiM2hiYRbCCTOmt/view?usp=share_link">
            Oitavas Primeira Parte
          </ExternalLink>
          <ExternalLink href="https://drive.google.com/file/d/1JvOw9M8yXRDhz1n4NRR8sxNCcQpiHwYH/view?usp=share_link">
            Oitavas Segunda Parte
          </ExternalLink>
          <ExternalLink href="https://drive.google.com/file/d/1p1KKfXJDMJu3KErYieUOMWeGwNLRwOsD/view?usp=share_link">
            Quartas
          </ExternalLink>
          <ExternalLink href="https://drive.google.com/file/d/1i2QLTJ1YtYh7Cww1Ni8eFv-vhmIReL5h/view?usp=share_link">
            Semifinais
          </ExternalLink>
        </div>
        <div className="text-xs text-right italic">
          A Classificação é atualizada com as partidas em andamento, portanto as
          posições podem ser alteradas durante o jogo
        </div>
        <div className="text-xs text-right italic">
          O tempo médio de atualização é de 5 minutos
        </div>
      </main>
      <Footer updateTime={updateTime} expire={expire} />
    </div>
  );
}

const MAX_ITEMS_BEST_OF_DAY = 8;

export const getServerSideProps: GetServerSideProps<{
  ranking: Ranking;
  matchesOfDay: MatchResult[];
  bestOfDay: RankingItem[];
}> = async ({ res }) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=86400"
  );
  const ranking = await getRanking();
  const matchesOfDay = getMatchesOfDay(ranking.matches);
  const bestOfDay = bestRankingForMatches(
    matchesOfDay,
    ranking.items,
    MAX_ITEMS_BEST_OF_DAY
  );
  // Pass data to the page via props
  return { props: { ranking, matchesOfDay, bestOfDay } };
};

export default Home;
