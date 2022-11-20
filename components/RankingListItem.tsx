import Link from "next/link";
import { RankingItem } from "../lib/ranking";
import React from "react";

interface RankingListItemProps {
  rankingItem: RankingItem;
}

const RankingListItem: React.FC<RankingListItemProps> = ({
  rankingItem: { position, player, points, countPoints },
}) => {
  return (
    <li className="px-4 py-2 border-b border-gray-200 w-full hover:bg-slate-200">
      <Link className="flex" href={`/players/${player.id}`}>
        <div className="text-sm w-5 m-auto">{position}</div>
        <div className="grow text-ellipsis whitespace-nowrap overflow-hidden">
          {player.name}
        </div>
        <div className="flex flex-nowrap shrink-0 w-48">
          <div className="w-full text-center">{points}</div>
          <div className="w-full text-center">{countPoints[10] || 0}</div>
          <div className="w-full text-center">{countPoints[7] || 0}</div>
          <div className="w-full text-center">{countPoints[5] || 0}</div>
        </div>
      </Link>
    </li>
  );
};

export default RankingListItem;
