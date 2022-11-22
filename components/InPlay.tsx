import { MatchStatus } from "../lib/ranking";
import React from "react";

interface InPlayProps {
  status: MatchStatus;
}

const InPlay: React.FC<InPlayProps> = ({ status }) => {
  return (
    <div className="text-white bg-green-600 rounded-md px-2 whitespace-nowrap my-auto text-xs italic inline-block">
      {status === "IN_PLAY" ? "Em Andamento" : ""}
    </div>
  );
};

export default InPlay;
