import { RankingItem } from "../lib/ranking";
import { ScorePoints } from "../lib/getConfig";
import RankingListHeader from "./RankingListHeader";
import RankingListItem from "./RankingListItem";
import React from "react";

interface RankingListProps {
  rankingItems: RankingItem[];
  lastPosition: number;
  scorePoints: ScorePoints;
}

const RankingList: React.FC<RankingListProps> = ({
  rankingItems,
  lastPosition,
  scorePoints,
}) => {
  return (
    <div className="flex flex-col justify-center h-full">
      <RankingListHeader className="sticky top-0" scorePoints={scorePoints} />
      <ul className="grow w-full text-gray-900 overflow-y-auto">
        {rankingItems.map((item, index) => (
          <RankingListItem
            key={index}
            rankingItem={item}
            lastPosition={lastPosition}
          />
        ))}
      </ul>
    </div>
  );
};

export default RankingList;
