import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import BetsList from "../../components/BetsList";
import Footer from "../../components/Footer";
import RankingList from "../../components/RankingList";
import { getPhaseState } from "../../lib/phaseState";
import { getPlayerByID, Player } from "../../lib/getPlayers";
import getRanking, { MatchResult, RankingItem } from "../../lib/ranking";
import { getConfig, Config } from "../../lib/getConfig";
import { getVisibleCompetitionPhases, normalizeCompetitionPhase } from "../../lib/tournamentPhase";

const PlayerDetails = ({
  player,
  rankingItem,
  lastPosition,
  matches,
  updateTime,
  expire,
  config,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <div className="md:mx-auto md:w-3/4 grid">
      <Head>
        <title>{`Palpites - ${player.name} - ${config.tournament.title}`}</title>
        <meta
          name="description"
          content={`Palpites de ${player.name} para ${config.tournament.title}`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <h1 className="p-2 text-lg text-gray-700 font-bold">
        <Link href="/">⇦ {config.tournament.title} - Palpites</Link>
      </h1>
      <RankingList
        rankingItems={[rankingItem]}
        lastPosition={lastPosition}
        scorePoints={config.scorePoints}
      />
      <BetsList rankingItem={rankingItem} matches={matches} />
      <Footer updateTime={updateTime} expire={expire} config={config} />
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
  config: Config;
}> = async ({ req, res, params }) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=86400"
  );
  const id = parseInt(params?.id as string);
  const player = await getPlayerByID(id);
  if (!player) {
    return {
      notFound: true,
    };
  }
  const [ranking, config] = await Promise.all([getRanking(), getConfig()]);
  const phaseState = getPhaseState(config, ranking.matches);
  const visiblePhases = new Set(
    getVisibleCompetitionPhases(phaseState.currentPhase)
  );
  const visibleMatches = ranking.matches.filter((match) => {
    const phase = normalizeCompetitionPhase(match.fase);
    return phase != null && visiblePhases.has(phase);
  });
  const rankingItem = ranking.items.find((item) => item.player.id === id);
  if (!rankingItem) {
    return {
      notFound: true,
    };
  }
  const visibleMatchIds = new Set(visibleMatches.map((match) => match.id));
  const visibleRankingItem: RankingItem = {
    ...rankingItem,
    bets: rankingItem.bets.filter(
      (bet) => bet?.matchID != null && visibleMatchIds.has(bet.matchID)
    ),
  };
  return {
    props: {
      player,
      matches: visibleMatches,
      rankingItem: visibleRankingItem,
      updateTime: ranking.updateTime,
      expire: ranking.expire,
      lastPosition: ranking.lastPosition,
      config,
    },
  };
};

export default PlayerDetails;
