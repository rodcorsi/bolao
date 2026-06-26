import { BetResult, MatchResult } from "../lib/ranking";

import InPlay from "./InPlay";
import Link from "next/link";
import React from "react";
import TeamCrest from "./TeamCrest";
import { formatDateTime } from "../lib/formatDate";
import { selectGoals } from "../lib/getFootballFixture";
import { t } from "../lib/translate";

interface BetsMatchProps {
  match: MatchResult;
  bet?: BetResult;
}

const BetsMatch: React.FC<BetsMatchProps> = ({ match, bet }) => {
  const goals = selectGoals(match.fixture);
  const hasBet = bet != null && bet.homeGoals != null && bet.awayGoals != null;
  return (
    <li className="min-w-0 hover:bg-slate-200">
      <Link className="block min-w-0" href={`/matches/${match.id}`}>
        <div className="flex min-w-0 flex-nowrap mt-2 items-center gap-2">
          <div className="min-w-0 flex-1 text-right text-ellipsis whitespace-nowrap overflow-hidden">
            {t(match.homeTeam)}
          </div>
          <TeamCrest
            crest={match.fixture.homeTeam.crest}
            teamName={match.homeTeam}
          />
          {!hasBet ? (
            <>
              <div className="w-6 shrink-0 text-lg text-center"></div>
              <div className="shrink-0 text-sm text-center">x</div>
              <div className="w-6 shrink-0 text-lg text-center"></div>
            </>
          ) : (
            <>
              <IsEqual
                value={bet.homeGoals}
                expected={goals.homeTeam}
                className="w-6 shrink-0 text-lg text-center"
              >
                {bet.homeGoals}
              </IsEqual>
              <div className="shrink-0 text-sm text-center">x</div>
              <IsEqual
                value={bet.awayGoals}
                expected={goals.awayTeam}
                className="w-6 shrink-0 text-lg text-center"
              >
                {bet.awayGoals}
              </IsEqual>
            </>
          )}
          <TeamCrest
            crest={match.fixture.awayTeam.crest}
            teamName={match.awayTeam}
          />
          <div className="min-w-0 flex-1 text-ellipsis whitespace-nowrap overflow-hidden">
            {t(match.awayTeam)}
          </div>
          {hasBet ? (
            <Point points={bet?.points} />
          ) : (
            <div className="w-8 shrink-0" />
          )}
        </div>
        <div className="flex min-w-0 flex-nowrap text-xs items-center justify-between italic mt-2">
          <div className="truncate">
            {formatDateTime(match.fixture.utcDate)}
          </div>
          <InPlay status={match.status} />
          {goals.homeTeam != null ? (
            <div className="font-bold text-sm shrink-0 px-2 text-slate-900 rounded-full ring-1 ring-slate-400">
              <span className="min-w-0 truncate font-medium">Placar </span>
              <span>{goals.homeTeam}</span>
              <span> x </span>
              <span>{goals.awayTeam}</span>
            </div>
          ) : (
            <div className="min-w-0 flex-1 my-auto text-right" />
          )}
        </div>
        <hr className="mx-auto mt-2 w-48 h-px border-0 bg-gray-200" />
      </Link>
    </li>
  );
};

export default BetsMatch;

const Point: React.FC<{ points?: number | null }> = ({ points }) => {
  let color = "";
  if (points === 12) color = "text-green-600";
  else if (points != null && points >= 5) color = "text-blue-600";
  const formatPoints = points == null ? "" : `+${points}`;
  return (
    <div className={`w-8 shrink-0 text-right font-bold ${color}`}>
      {formatPoints}
    </div>
  );
};

interface IsEqualProps {
  value: number | null;
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
  if (expected != null && value != null) {
    color = expected === value ? "text-green-600" : "text-red-600";
  }
  return <div className={`${color} ${className}`}>{children}</div>;
};
