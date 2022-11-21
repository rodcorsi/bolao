import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import getRanking, { Ranking } from "../lib/ranking";

import Footer from "../components/Footer";
import Head from "next/head";
import Link from "next/link";
import RankingList from "../components/RankingList";

const VALUE_GAME = 30;
const SCHEELITA_VALUE = 1000;
const FIRST_PLACE = 0.6;
const SECOND_PLACE = 0.3;
const THIRD_PLACE = 0.1;

const currencyFormat = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
}).format;

function Home({
  ranking: { items, updateTime, lastPosition },
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const totalGame = items.length * VALUE_GAME + SCHEELITA_VALUE;
  const firstPlace = totalGame * FIRST_PLACE;
  const secondPlace = totalGame * SECOND_PLACE;
  const thirdPlace = totalGame * THIRD_PLACE;
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
        <div className="bg-white rounded-lg border border-gray-200">
          <RankingList rankingItems={items} lastPosition={lastPosition} />
        </div>
        <div className="px-2 font-bold text-sm text-gray-800">
          <div>{`Total de ${items.length} Jogos`}</div>
          <div>{`Premiação Total ${currencyFormat(
            totalGame
          )} a ser divida entre ganhadores`}</div>
          <div>{`1º 🥇 - ${currencyFormat(firstPlace)}`}</div>
          <div>{`2º 🥈 - ${currencyFormat(secondPlace)}`}</div>
          <div>{`3º 🥉 - ${currencyFormat(thirdPlace)}`}</div>
        </div>
        <div className="text-sm text-right">
          <Link
            href="https://drive.google.com/file/d/10HK_51xsTPTfR0X-3fRDqofp-M432Zch/view?usp=share_link"
            target="_blank"
            className="text-blue-600 hover:underline"
          >
            Jogos Originais (Fase Grupos)
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
}> = async ({ res }) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=86400"
  );
  const ranking = await getRanking();
  // Pass data to the page via props
  return { props: { ranking } };
};

export default Home;
