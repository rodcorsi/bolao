import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import BetsList from "../../components/BetsList";
import RankingList from "../../components/RankingList";
import { getPlayerByID, Player } from "../../lib/getPlayers";
import getRanking, { MatchResult, RankingItem } from "../../lib/ranking";

const Player = ({
  player,
  rankingItem,
  matches,
  updateTime,
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
        Bolão da Copa 2022 - Palpites
      </h1>
      <h2>Jogador: {player.name}</h2>
      <RankingList rankingItems={new Array(rankingItem)} />
      <BetsList rankingItem={rankingItem} matches={matches} />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<{
  player: Player;
  rankingItem: RankingItem;
  matches: MatchResult[];
  updateTime: string;
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
    },
  };
};

export default Player;
