import { BetResult, MatchResult } from "../lib/ranking";

import Image from "next/image";
import InPlay from "./InPlay";
import React from "react";
import { formatDateTime } from "../lib/formatDate";
import { selectGoals } from "../lib/getFootballFixture";

interface BetsMatchProps {
  match: MatchResult;
  bet: BetResult;
}

const BetsMatch: React.FC<BetsMatchProps> = ({ match, bet }) => {
  const goals = selectGoals(match.fixture);
  return (
    <li>
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
        <InPlay status={match.status} />
        <div className="w-full my-auto text-right">
          {goals.home != null && (
            <div className="font-bold text-sm text-gray-700">
              <span>Placar:</span>
              <span>{goals.home}</span>
              <span>x</span>
              <span>{goals.away}</span>
            </div>
          )}
        </div>
      </div>
      <hr className="mx-auto w-48 h-px border-0 bg-gray-200" />
    </li>
  );
};

export default BetsMatch;

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
