import Link from "next/link";
import MatchHeader from "./MatchHeader";
import { MatchResult } from "../lib/ranking";
import React from "react";
import { selectGoals } from "../lib/getFootballFixture";

interface ListActiveMatchesProps {
  matches: MatchResult[];
  className?: string;
}

const ListActiveMatches: React.FC<ListActiveMatchesProps> = ({
  matches,
  className,
}) => {
  return (
    <div className={className}>
      {matches.map((match) => {
        const goals = selectGoals(match.fixture);
        return (
          <Link href={`/matches/${match.id}`} key={match.id}>
            <MatchHeader
              className="hover:bg-slate-200 border-gray-200 border rounded-xl shadow-sm"
              match={match}
              homeGoals={goals.homeTeam}
              awayGoals={goals.awayTeam}
            />
          </Link>
        );
      })}
    </div>
  );
};

export default ListActiveMatches;
