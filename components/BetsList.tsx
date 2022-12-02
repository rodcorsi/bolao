import { BetResult, MatchResult, RankingItem } from "../lib/ranking";

import BetsMatch from "./BetsMatch";
import React from "react";
import groupByArray from "../lib/groupByArray";

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
  findBet: (matchID: number) => BetResult | undefined;
}

const Fase: React.FC<FaseProps> = ({ matches, findBet }) => {
  const groups = groupByArray(matches, "group");
  return (
    <div className="pt-1">
      <div className="bg-gray-700 text-white mb-3 px-3 py-1 font-bold sticky top-0">
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
        {matches.map((match) => (
          <BetsMatch key={match.id} match={match} bet={findBet(match.id)} />
        ))}
      </ul>
    </div>
  );
};
