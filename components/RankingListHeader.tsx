import React from "react";
import config from "../static_data/config.json";

const scorePoints = config.scorePoints;

export interface RankingListHeaderProps {
  className?: string;
}

const RankingListHeader: React.FC<RankingListHeaderProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`flex text-sm pl-4 pr-2 py-2 border-b bg-gray-700 text-white w-full md:rounded-t-lg ${className}`}
    >
      <div className="text-sm w-6 m-auto">#</div>
      <div className="grow text-ellipsis whitespace-nowrap overflow-hidden">
        Classificação
      </div>
      <div className="w-10 text-center my-auto text-xs flex-nowrap shrink-0">
        PTS
      </div>
      <div className="flex text-xs flex-nowrap shrink-0 text-center w-32">
        <div className="w-full my-auto">{`Q${scorePoints.EXACT}`}</div>
        <div className="w-full my-auto">{`Q${scorePoints.WINNER_AND_ONE_SCORE}`}</div>
        <div className="w-full my-auto">{`Q${scorePoints.WINNER}`}</div>
        <div className="w-full my-auto">{`Q${scorePoints.ONE_SCORE}`}</div>
      </div>
    </div>
  );
};

export default RankingListHeader;
