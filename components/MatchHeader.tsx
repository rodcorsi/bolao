import Image from "next/image";
import InPlay from "./InPlay";
import { MatchResult } from "../lib/ranking";
import React from "react";
import { formatDateTime } from "../lib/formatDate";

interface MatchHeaderProps {
  match: MatchResult;
  homeGoals?: React.ReactNode;
  awayGoals?: React.ReactNode;
  className?: string;
}

const MatchHeader: React.FC<MatchHeaderProps> = ({
  match,
  homeGoals,
  awayGoals,
  className = "",
}) => {
  return (
    <div className={className}>
      <div className={`flex flex-nowrap shrink-0 my-2 items-center`}>
        <div className="w-full text-right text-ellipsis whitespace-nowrap overflow-hidden">
          {match.homeTeam}
        </div>
        <Image
          className="bg-center rounded-full mx-2"
          style={{ height: 30 }}
          src={match.fixture.teams.home.logo}
          alt={`Bandeira ${match.homeTeam}`}
          width={30}
          height={30}
        />
        <div className="w-10 text-lg text-center">{homeGoals}</div>
        <div className="text-sm text-center">x</div>
        <div className="w-10 text-lg text-center">{awayGoals}</div>
        <Image
          className="bg-center rounded-full mx-2"
          style={{ height: 30 }}
          src={match.fixture.teams.away.logo}
          alt={`Bandeira ${match.awayTeam}`}
          width={30}
          height={30}
        />
        <div className="w-full text-ellipsis whitespace-nowrap overflow-hidden">
          {match.awayTeam}
        </div>
      </div>
      <div className="flex justify-between h-4 mb-2 text-xs px-2">
        <div className="w-full italic">
          {formatDateTime(match.fixture.fixture.date)}
        </div>
        <InPlay status={match.status} />
        <div className="w-full" />
      </div>
    </div>
  );
};

export default MatchHeader;
