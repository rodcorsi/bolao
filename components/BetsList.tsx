import { BetResult, MatchResult, RankingItem } from "../lib/ranking";

import Image from "next/image";
import React from "react";
import { formatDateTime } from "../lib/formatDate";
import groupByArray from "../lib/groupByArray";
import { selectGoals } from "../lib/getFootballFixture";

interface BetsListProps {
  rankingItem: RankingItem;
  matches: MatchResult[];
}

const BetsList: React.FC<BetsListProps> = ({ rankingItem, matches }) => {
  const fases = groupByArray(matches, "fase");
  const betMap = rankingItem.bets.reduce((acc, bet) => {
    acc[bet.matchID] = bet;
    return acc;
  }, {} as { [matchID: number]: BetResult });
  const findBet = (matchID: number) => betMap[matchID];
  return (
    <div className="flex flex-col justify-center h-full">
      {fases.map((matches, index) => (
        <Fase key={index} matches={matches} findBet={findBet} />
      ))}
    </div>
  );
};

export default BetsList;

interface FaseProps {
  matches: MatchResult[];
  findBet: (matchID: number) => BetResult;
}

const Fase: React.FC<FaseProps> = ({ matches, findBet }) => {
  const groups = groupByArray(matches, "group");
  return (
    <div className="pt-1">
      <div className="bg-gray-700 text-white mb-3 px-3 py-1 font-bold">
        {matches[0].fase}
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        {groups.map((matches, index) => (
          <Group key={index} matches={matches} findBet={findBet} />
        ))}
      </div>
    </div>
  );
};

const Group: React.FC<FaseProps> = ({ matches, findBet }) => {
  return (
    <div className="border-2 border-gray-200 p-3 rounded-lg">
      <div className="flex justify-between border-b border-gray-200 pb-2 text-gray-700 italic">
        <div className="font-bold">{matches[0].group}</div>
        <div className="w-10 text-xs text-right my-auto">Pontos</div>
      </div>
      <ul>
        {matches.map((match) => {
          const bet = findBet(match.id);
          const goals = selectGoals(match.fixture);
          return (
            <li key={match.id}>
              <div className="flex flex-nowrap shrink-0 mt-2">
                <div className="w-full text-right text-ellipsis whitespace-nowrap overflow-hidden">
                  {match.homeTeam}
                </div>
                <Image
                  className="bg-center rounded-full mx-2"
                  src={match.fixture.teams.home.logo}
                  alt={`Bandeira ${match.homeTeam}`}
                  width={30}
                  height={30}
                />
                <IsEqual
                  value={bet.homeGoals}
                  expected={goals.home}
                  className="w-10 text-lg text-center"
                >
                  {bet.homeGoals}
                </IsEqual>
                <div className="text-sm text-center m-auto">x</div>
                <IsEqual
                  value={bet.awayGoals}
                  expected={goals.away}
                  className="w-10 text-lg text-center"
                >
                  {bet.awayGoals}
                </IsEqual>
                <Image
                  className="bg-center rounded-full mx-2"
                  src={match.fixture.teams.away.logo}
                  alt={`Bandeira ${match.awayTeam}`}
                  width={30}
                  height={30}
                />
                <div className="w-full text-ellipsis whitespace-nowrap overflow-hidden">
                  {match.awayTeam}
                </div>
                <Point points={bet.points} />
              </div>
              <div className="flex flex-nowrap shrink-0 text-xs justify-between italic mt-2">
                <div className="w-full">
                  {formatDateTime(match.fixture.fixture.date)}
                </div>
                <div className="text-white bg-green-600 rounded-md px-2 whitespace-nowrap my-auto">
                  {match.status === "IN_PLAY" ? "Em Andamento" : ""}
                </div>
                <div className="w-full my-auto text-right">
                  {!!goals.home && (
                    <div className="font-bold text-sm">
                      <span>Placar:</span>
                      <span>{goals.home}</span>
                      <span>x</span>
                      <span>{goals.away}</span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Point: React.FC<{ points?: number | null }> = ({ points }) => {
  let color = "";
  if (points === 12) color = "text-green-600";
  else if (points != null && points >= 5) color = "text-blue-600";
  return <div className={`w-10 text-right font-bold ${color}`}>{points}</div>;
};

interface IsEqualProps {
  value: number;
  expected?: number | null;
  className?: string;
  children?: React.ReactNode;
}
const IsEqual: React.FC<IsEqualProps> = ({
  expected,
  value,
  className = "",
  children,
}) => {
  let color = "";
  if (expected != null) {
    color = expected === value ? "text-green-600" : "text-red-600";
  }
  return <div className={`${color} ${className}`}>{children}</div>;
};
