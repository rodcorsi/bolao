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
    <div className={`text-sm w-5 m-auto text-center ${className}`}>
      {medals[position] || (position === lastPosition ? "🍍" : position)}
    </div>
  );
};

export default Position;
