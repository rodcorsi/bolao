import Link from "next/link";
import Position from "./Position";
import { RankingItem } from "../lib/ranking";
import React from "react";

interface RankingListItemProps {
  rankingItem: RankingItem;
  lastPosition: number;
}

const RankingListItem: React.FC<RankingListItemProps> = ({
  rankingItem: { position, player, points, countPoints },
  lastPosition,
}) => {
  return (
    <li className="px-4 py-2 border-b border-gray-200 w-full hover:bg-slate-200">
      <Link className="flex" href={`/players/${player.id}`}>
        <Position position={position} lastPosition={lastPosition} />
        <div className="grow text-ellipsis whitespace-nowrap overflow-hidden">
          {player.name}
        </div>
        <div className="flex flex-nowrap shrink-0 w-48">
          <div className="w-full text-center">{points}</div>
          <div className="w-full text-center">{countPoints.P12}</div>
          <div className="w-full text-center">{countPoints.P7}</div>
          <div className="w-full text-center">{countPoints.P5}</div>
        </div>
      </Link>
    </li>
  );
};

export default RankingListItem;
