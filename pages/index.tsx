import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import getRanking, { Ranking } from "../lib/ranking";

import Head from "next/head";
import Link from "next/link";

function Home({
  ranking: { items, matches },
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const now = new Date();
  return (
    <div>
      <Head>
        <title>Bolão Scheelita Copa 2022</title>
        <meta
          name="description"
          content="Pagina com resultados do bolão da scheelita copa 2022"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Ranking Geral</h1>

        <table>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Nome</th>
              {matches.map((match) => (
                <th key={match.id}>
                  <div className="-rotate-90">
                    {match.homeTeam + "x" + match.awayTeam}
                  </div>
                </th>
              ))}
              <th>Pontuação</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.position}</td>
                <td>
                  <Link href={`/players/${item.player.id}`}>
                    {item.player.name}
                  </Link>
                </td>
                {item.bets.map((item) => (
                  <td key={item.matchID}>{item.points ?? ""}</td>
                ))}
                <td>{item.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      <footer>{`Atualizado: ${now.toLocaleDateString("pt-BR")}`}</footer>
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
