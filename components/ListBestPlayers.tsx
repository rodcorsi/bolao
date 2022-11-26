import Link from "next/link";
import Position from "./Position";
import { RankingItem } from "../lib/ranking";
import React from "react";

interface ListBestPlayersProps {
  rankingItems: RankingItem[];
  className?: string;
}

const ListBestPlayers: React.FC<ListBestPlayersProps> = ({
  rankingItems,
  className,
}) => {
  if (rankingItems.length === 0) return null;
  return (
    <div className={className}>
      <h3 className="font-bold text-lg text-gray-700">
        Maiores Pontuadores do dia
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-2">
        {rankingItems.map(({ player, points, position }, index) => (
          <Link key={index} href={`/players/${player.id}`}>
            <div className="flex hover:bg-slate-200 py-4 px-2 border-gray-200 border">
              <Position position={position} lastPosition={position + 1} />
              <div className="w-full whitespace-nowrap flex-nowrap text-ellipsis overflow-hidden">
                {player.name}
              </div>
              <div className="w-9 font-bold whitespace-nowrap flex-nowrap text-gray-700">
                {"+" + points}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ListBestPlayers;
