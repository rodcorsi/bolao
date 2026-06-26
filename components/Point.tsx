import React from "react";

const Point: React.FC<{ points?: number | null; className?: string }> = ({
  points,
  className = "",
}) => {
  let color = "";
  if (points === 12) color = "text-green-600";
  else if (points != null && points >= 5) color = "text-blue-600";
  const formatPoints = points == null ? "" : `+${points}`;
  return (
    <div className={`shrink-0 font-bold ${color} ${className}`}>
      {formatPoints}
    </div>
  );
};

export default Point;
