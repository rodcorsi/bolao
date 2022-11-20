import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import getRanking, { Ranking } from "../lib/ranking";

import Footer from "../components/Footer";
import Head from "next/head";
import RankingList from "../components/RankingList";

function Home({
  ranking: { items, updateTime },
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const now = new Date();
  return (
    <div className="md:mx-auto md:w-3/4 grid h-screen grid-rows-layout">
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
        <div className="bg-white rounded-lg border border-gray-200 h-full">
          <RankingList rankingItems={items} />
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
