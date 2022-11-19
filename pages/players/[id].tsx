import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getPlayerByID, Player } from "../../lib/getPlayers";
import { useRouter } from "next/router";
import getBets, { getBetsByPlayerID } from "../../lib/getBets";
import { BetResult, getBetsResultByPlayer } from "../../lib/getBetResults";

const Player = ({
  player,
  bets,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <div className="container mx-auto">
      <h1>Bolão Copa 2022</h1>
      <h2>Jogador: {player.name}</h2>
      <ul>
        {bets.map((bet) => (
          <li key={bet.matchID}>
            <div className="flex">
              <div>{bet.match.homeTeam}</div>
              <div>{bet.homeGoals}</div>
              <div>x</div>
              <div>{bet.match.awayTeam}</div>
              <div>{bet.awayGoals}</div>
              <div>{bet.points == null ? "" : bet.points}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<{
  player: Player;
  bets: BetResult[];
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
  const bets = await getBetsResultByPlayer(id);
  return { props: { player, bets } };
};

export default Player;
