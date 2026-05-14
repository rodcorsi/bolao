import React from "react";

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
    <img
      className="mx-2 rounded-full bg-center"
      style={{ height: 30, width: 30 }}
      src={crest}
      alt={`Escudo ${teamName}`}
    />
  );
};

export default TeamCrest;
