import React from "react";

interface PositionProps {
  position: number;
  lastPosition: number;
  className?: string;
}

const medals: { [position: number]: string } = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

const Position: React.FC<PositionProps> = ({
  position,
  lastPosition,
  className = "",
}) => {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 ${className}`}
    >
      {medals[position] || (position === lastPosition ? "🍍" : position)}
    </div>
  );
};

export default Position;
