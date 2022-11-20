import React from "react";

export interface RankingListHeaderProps {
  className?: string;
}

const RankingListHeader: React.FC<RankingListHeaderProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`flex text-sm px-4 py-2 border-b bg-gray-700 w-full rounded-t-lg ${className}`}
    >
      <div className="text-sm w-6 m-auto text-white">#</div>
      <div className="grow text-ellipsis whitespace-nowrap overflow-hidden text-white">
        Classificação
      </div>
      <div className="flex flex-nowrap shrink-0 w-48 text-white mr-2">
        <div className="w-full text-center">Pontos</div>
        <div className="w-full text-center">Qtd 12</div>
        <div className="w-full text-center">Qtd 7</div>
        <div className="w-full text-center">Qtd 5</div>
      </div>
    </div>
  );
};

export default RankingListHeader;
