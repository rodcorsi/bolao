import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import getRanking, {
  MatchResult,
  Ranking,
  RankingItem,
} from "../../lib/ranking";

import Footer from "../../components/Footer";
import Head from "next/head";
import Link from "next/link";
import MatchHeader from "../../components/MatchHeader";
import Position from "../../components/Position";
import { selectGoals } from "../../lib/getFootballFixture";

const Match = ({
  ranking,
  matchIndex,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const match = ranking.matches[matchIndex];
  const matchName = match.homeTeam + " x " + match.awayTeam;
  const goals = selectGoals(match.fixture);
  const itemsByPoints = sortByPoints(ranking.items, matchIndex);
  return (
    <div className="md:mx-auto md:w-3/4 grid">
      <Head>
        <title>{`${matchName} - Bolão Scheelita Copa 2022`}</title>
        <meta
          name="description"
          content={`Resultado do jogo ${matchName} para o bolão da scheelita copa 2022`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1 className="p-2 text-lg text-gray-700 font-bold">
        <Link href="/">⇦ Bolão da Copa 2022 - Jogo</Link>
      </h1>
      <MatchHeader
        match={match}
        homeGoals={goals.home || 0}
        awayGoals={goals.away || 0}
      />
      <div
        className={`flex text-sm px-3 py-2 border-b bg-gray-700 w-full rounded-t-lg sticky top-0 text-white `}
      >
        <div className="text-sm w-6 m-auto">#</div>
        <div className="grow text-ellipsis whitespace-nowrap overflow-hidden">
          Classificação
        </div>
        <div className="flex-nowrap shrink-0 w-14 mr-2">Palpite</div>
        <div className="flex-nowrap shrink-0 w-14 text-right">Pontos</div>
      </div>
      <ul className="grow w-full text-gray-900 border border-gray-200">
        {itemsByPoints.map(({ position, player, bets }, index) => {
          const bet = bets[matchIndex];
          return (
            <li
              key={index}
              className="px-2 py-2 border-b border-gray-200 w-full hover:bg-slate-200"
            >
              <Link className="flex" href={`/players/${player.id}`}>
                <Position
                  position={position}
                  lastPosition={ranking.lastPosition}
                />
                <div className="grow text-ellipsis whitespace-nowrap overflow-hidden">
                  {player.name}
                </div>
                <div className="w-14">{`${bet.homeGoals} x ${bet.awayGoals}`}</div>
                <div className="w-14 text-right">{bet.points}</div>
              </Link>
            </li>
          );
        })}
      </ul>
      <Footer updateTime={ranking.updateTime} />
    </div>
  );
};

function sortByPoints(rankingItems: RankingItem[], matchIndex: number) {
  const itemsByPoints = [...rankingItems];
  itemsByPoints.sort(
    (a, b) =>
      (b.bets[matchIndex].points || 0) - (a.bets[matchIndex].points || 0)
  );
  return itemsByPoints;
}

export const getServerSideProps: GetServerSideProps<{
  ranking: Ranking;
  matchIndex: number;
}> = async ({ req, res, params }) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=86400"
  );
  const id = parseInt(params?.id as string);
  const ranking = await getRanking();
  const matchIndex = ranking.matches.findIndex((match) => match.id === id);
  if (matchIndex < 0) {
    return {
      notFound: true,
    };
  }
  return {
    props: {
      ranking,
      matchIndex,
    },
  };
};

export default Match;
