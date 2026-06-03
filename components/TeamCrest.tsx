import React from "react";
import Image from "next/image";

interface TeamCrestProps {
  crest?: string | null;
  teamName: string;
}

const TeamCrest: React.FC<TeamCrestProps> = ({ crest, teamName }) => {
  if (!crest) {
    return (
      <div
        className="mx-2 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600"
        aria-label={`Sem escudo para ${teamName}`}
      >
        {teamName.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      className="mx-2 rounded-full bg-center"
      src={crest}
      alt={`Escudo ${teamName}`}
      width={30}
      height={30}
      unoptimized
    />
  );
};

export default TeamCrest;
