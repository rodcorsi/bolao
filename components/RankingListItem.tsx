import ChangePosition from "./ChangePosition";
import Link from "next/link";
import Position from "./Position";
import { RankingItem } from "../lib/ranking";
import React from "react";

interface RankingListItemProps {
  rankingItem: RankingItem;
  lastPosition: number;
}

const RankingListItem: React.FC<RankingListItemProps> = ({
  rankingItem: { position, oldPosition, player, points, countPoints },
  lastPosition,
}) => {
  return (
    <li className="px-2 py-2 border-b border-gray-200 w-full hover:bg-slate-200">
      <Link className="flex" href={`/players/${player.id}`}>
        <Position position={position} lastPosition={lastPosition} />
        <div className="grow text-ellipsis whitespace-nowrap overflow-hidden">
          {player.name}
        </div>
        <ChangePosition
          className="w-6 text-center"
          position={position}
          oldPosition={oldPosition}
        />
        <div className="w-10 flex-nowrap my-auto shrink-0 text-center font-bold">
          {points}
        </div>
        <div className="flex flex-nowrap shrink-0 w-32 text-center text-sm">
          <div className="w-full my-auto">{countPoints.exact}</div>
          <div className="w-full my-auto">{countPoints.winnerAndOneScore}</div>
          <div className="w-full my-auto">{countPoints.winner}</div>
          <div className="w-full my-auto">{countPoints.oneScore}</div>
        </div>
      </Link>
    </li>
  );
};

export default RankingListItem;
