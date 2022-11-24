import React from "react";

interface ChangePositionProps {
  position: number;
  oldPosition: number;
  className?: string;
}

const downArrow = <span className="text-red-700">↓</span>;
const upArrow = <span className="text-green-700">↑</span>;

const ChangePosition: React.FC<ChangePositionProps> = ({
  position,
  oldPosition,
  className,
}) => {
  const variation = oldPosition - position;
  let arrow: React.ReactNode = "·";
  if (variation > 0) {
    arrow = (
      <div>
        <span className="text-xs">{variation}</span>
        {upArrow}
      </div>
    );
  } else if (variation < 0) {
    arrow = (
      <div>
        <span className="text-xs">{-variation}</span>
        {downArrow}
      </div>
    );
  }
  return <div className={className}>{arrow}</div>;
};

export default ChangePosition;
