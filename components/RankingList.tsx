import { RankingItem } from "../lib/ranking";
import RankingListHeader from "./RankingListHeader";
import RankingListItem from "./RankingListItem";
import React from "react";

interface RankingListProps {
  rankingItems: RankingItem[];
  lastPosition: number;
}

const RankingList: React.FC<RankingListProps> = ({
  rankingItems,
  lastPosition,
}) => {
  return (
    <div className="flex flex-col justify-center h-full">
      <RankingListHeader className="sticky top-0" />
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
