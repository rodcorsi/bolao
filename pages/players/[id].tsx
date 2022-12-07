import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import BetsList from "../../components/BetsList";
import Footer from "../../components/Footer";
import RankingList from "../../components/RankingList";
import { getPlayerByID, Player } from "../../lib/getPlayers";
import getRanking, { MatchResult, RankingItem } from "../../lib/ranking";

const Player = ({
  player,
  rankingItem,
  lastPosition,
  matches,
  updateTime,
  expire,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <div className="md:mx-auto md:w-3/4 grid">
      <Head>
        <title>{`Palpites - ${player.name} - Bolão Scheelita Copa 2022`}</title>
        <meta
          name="description"
          content={`Palpites de ${player.name} para o bolão da scheelita copa 2022`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1 className="p-2 text-lg text-gray-700 font-bold">
        <Link href="/">⇦ Bolão da Copa 2022 - Palpites</Link>
      </h1>
      <RankingList rankingItems={[rankingItem]} lastPosition={lastPosition} />
      <BetsList rankingItem={rankingItem} matches={matches} />
      <Footer updateTime={updateTime} expire={expire} />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<{
  player: Player;
  rankingItem: RankingItem;
  lastPosition: number;
  matches: MatchResult[];
  updateTime: string;
  expire: number;
}> = async ({ req, res, params }) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=86400"
  );
  const id = parseInt(params?.id as string);
  const player = getPlayerByID(id);
  if (!player) {
    return {
      notFound: true,
    };
  }
  const ranking = await getRanking();
  const rankingItem = ranking.items.find((item) => item.player.id === id);
  if (!rankingItem) {
    return {
      notFound: true,
    };
  }
  return {
    props: {
      player,
      matches: ranking.matches,
      rankingItem,
      updateTime: ranking.updateTime,
      expire: ranking.expire,
      lastPosition: ranking.lastPosition,
    },
  };
};

export default Player;
