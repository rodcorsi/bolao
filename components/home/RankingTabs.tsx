import { PhaseRanking } from "../../lib/phaseRankings";
import RankingList from "../RankingList";
import React, { useState } from "react";
import { ScorePoints } from "../../lib/getConfig";

interface RankingTabsProps {
  rankings: PhaseRanking[];
  scorePoints: ScorePoints;
}

const RankingTabs: React.FC<RankingTabsProps> = ({ rankings, scorePoints }) => {
  const [activeKey, setActiveKey] = useState<PhaseRanking["key"]>(
    rankings[0]?.key ?? "geral",
  );
  const active = rankings.find((r) => r.key === activeKey) ?? rankings[0];

  if (!active) {
    return null;
  }

  return (
    <div>
      <div
        role="tablist"
        className="flex gap-1 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-1 shadow-inner"
      >
        {rankings.map((ranking) => {
          const isActive = ranking.key === active.key;
          return (
            <button
              key={ranking.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveKey(ranking.key)}
              className={`flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold transition ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-700/10"
                  : "text-emerald-800/70 hover:bg-white/70 hover:text-emerald-900"
              }`}
            >
              {ranking.label}
            </button>
          );
        })}
      </div>
      {active.hasMatches ? (
        <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <RankingList
            rankingItems={active.items}
            lastPosition={active.lastPosition}
            scorePoints={scorePoints}
          />
        </div>
      ) : (
        <p className="mt-3 rounded-2xl bg-white px-4 py-6 text-center text-sm text-gray-500 ring-1 ring-gray-200">
          Ainda não há jogos nesta etapa.
        </p>
      )}
    </div>
  );
};

export default RankingTabs;
