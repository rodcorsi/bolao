import Image from "next/image";
import InPlay from "./InPlay";
import { MatchResult } from "../lib/ranking";
import React from "react";

interface MatchHeaderProps {
  match: MatchResult;
  homeGoals: React.ReactNode;
  awayGoals: React.ReactNode;
  className?: string;
}

const MatchHeader: React.FC<MatchHeaderProps> = ({
  match,
  homeGoals,
  awayGoals,
  className = "",
}) => {
  return (
    <div>
      <div className={`flex flex-nowrap shrink-0 my-2 ${className}`}>
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
        <div className="w-10 text-lg text-center">{homeGoals}</div>
        <div className="text-sm text-center m-auto">x</div>
        <div className="w-10 text-lg text-center">{awayGoals}</div>
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
      </div>
      <div className="flex mb-2 justify-center">
        <InPlay status={match.status} />
      </div>
    </div>
  );
};

export default MatchHeader;
