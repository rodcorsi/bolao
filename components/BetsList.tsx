import { BetResult, MatchResult, RankingItem } from "../lib/ranking";

import BetsMatch from "./BetsMatch";
import React from "react";
import groupByArray from "../lib/groupByArray";
import startOfDay from "../lib/startOfDay";
import { sumPoints } from "../lib/rankingSummary";

const TIME_ZONE = "America/Sao_Paulo";
const TODAY = startOfDay(Date.now(), TIME_ZONE);

interface BetsListProps {
  rankingItem: RankingItem;
  matches: MatchResult[];
}

const BetsList: React.FC<BetsListProps> = ({ rankingItem, matches }) => {
  const fases = groupByArray(matches, "fase");
  const betMap = rankingItem.bets.reduce(
    (acc, bet) => {
      acc[bet.matchID] = bet;
      return acc;
    },
    {} as { [matchID: number]: BetResult },
  );
  const findBet = (matchID: number) => betMap[matchID];
  return (
    <div className="flex flex-col justify-center h-full">
      {fases.map((matches, index) => (
        <Fase
          key={index}
          matches={matches}
          bets={rankingItem.bets}
          findBet={findBet}
        />
      ))}
    </div>
  );
};

export default BetsList;

interface FaseProps {
  matches: MatchResult[];
  bets: BetResult[];
  findBet: (matchID: number) => BetResult | undefined;
}

const Fase: React.FC<FaseProps> = ({ matches, bets, findBet }) => {
  const days = groupMatchesByDay(matches);
  return (
    <div className="min-w-0 pt-1">
      <div className="bg-gray-700 text-white mb-3 px-3 py-1 font-bold sticky top-0">
        {matches[0].fase}
      </div>
      <div className="space-y-4">
        {days.map((matches) => (
          <Day
            key={startOfDay(matches[0].fixture.utcDate, TIME_ZONE)}
            matches={matches}
            bets={bets}
            findBet={findBet}
          />
        ))}
      </div>
    </div>
  );
};

interface DayProps {
  matches: MatchResult[];
  bets: BetResult[];
  findBet: (matchID: number) => BetResult | undefined;
}

const Day: React.FC<DayProps> = ({ matches, bets, findBet }) => {
  const groups = groupByArray(matches, "group");
  const matchIds = new Set(matches.map((match) => match.id));
  const dayPoints = sumPoints(bets.filter((bet) => matchIds.has(bet.matchID)));
  const day = startOfDay(matches[0].fixture.utcDate, TIME_ZONE);
  const isFutureDay = day > TODAY;

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between rounded-lg bg-sky-50 px-3 py-2 text-sky-800">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-600">
            Jogos do dia
          </div>
          <div className="truncate font-bold">
            {formatDay(matches[0].fixture.utcDate)}
          </div>
        </div>
        {!isFutureDay && (
          <div className="flex shrink-0 flex-col items-center rounded-xl bg-sky-50 px-3 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-600">
              Dia
            </span>
            <span className="text-lg font-black leading-tight text-sky-700">
              {`+ ${dayPoints}`}
            </span>
          </div>
        )}
      </div>
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        {groups.map((matches, index) => (
          <Group key={index} matches={matches} findBet={findBet} />
        ))}
      </div>
    </div>
  );
};

interface GroupProps {
  matches: MatchResult[];
  findBet: (matchID: number) => BetResult | undefined;
}

const Group: React.FC<GroupProps> = ({ matches, findBet }) => {
  return (
    <div className="min-w-0 rounded-lg border-2 border-gray-200 p-3">
      <div className="flex justify-between border-b border-gray-200 pb-2 text-gray-700 italic">
        <div className="font-bold">{matches[0].group}</div>
        <div className="w-10 text-xs text-right my-auto">Pontos</div>
      </div>
      <ul className="min-w-0">
        {matches.map((match) => (
          <BetsMatch key={match.id} match={match} bet={findBet(match.id)} />
        ))}
      </ul>
    </div>
  );
};

function groupMatchesByDay(matches: MatchResult[]) {
  return matches.reduce((acc, match) => {
    const day = startOfDay(match.fixture.utcDate, TIME_ZONE);
    const lastMatches = acc[acc.length - 1];
    const lastDay = lastMatches
      ? startOfDay(lastMatches[0].fixture.utcDate, TIME_ZONE)
      : null;

    if (lastDay !== day) {
      acc.push([match]);
    } else {
      lastMatches.push(match);
    }

    return acc;
  }, [] as MatchResult[][]);
}

function formatDay(date: Date | string | number) {
  return new Date(date).toLocaleDateString("pt-BR", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
