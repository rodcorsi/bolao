import { MatchResult, RankingItem } from "../lib/ranking";
import {
  BETS_DAY_ANCHORS,
  getBetsDay,
  getYesterdayBetsDay,
} from "../lib/betsDay";

import Link from "next/link";
import React from "react";
import { sumPoints } from "../lib/rankingSummary";

interface RecentPointsSummaryProps {
  rankingItem: RankingItem;
  matches: MatchResult[];
  today: number;
  timeZone: string;
}

const RecentPointsSummary: React.FC<RecentPointsSummaryProps> = ({
  rankingItem,
  matches,
  today,
  timeZone,
}) => {
  const yesterday = getYesterdayBetsDay(today, timeZone);
  const todaySummary = getDaySummary(matches, rankingItem, today, timeZone);
  const yesterdaySummary = getDaySummary(
    matches,
    rankingItem,
    yesterday,
    timeZone,
  );

  return (
    <section className="mx-2 mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        Resumo recente
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <RecentPointsItem
          label="Hoje"
          points={todaySummary.points}
          hasMatches={todaySummary.hasMatches}
          href={`#${BETS_DAY_ANCHORS.today}`}
        />
        <RecentPointsItem
          label="Ontem"
          points={yesterdaySummary.points}
          hasMatches={yesterdaySummary.hasMatches}
          href={`#${BETS_DAY_ANCHORS.yesterday}`}
        />
      </div>
    </section>
  );
};

export default RecentPointsSummary;

interface RecentPointsItemProps {
  label: string;
  points: number;
  hasMatches: boolean;
  href: string;
}

const RecentPointsItem: React.FC<RecentPointsItemProps> = ({
  label,
  points,
  hasMatches,
  href,
}) => {
  const content = (
    <div className="flex flex-col items-center rounded-xl bg-sky-50 px-3 py-2 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-600">
        {label}
      </span>
      <span className="text-lg font-black leading-tight text-sky-700">
        {hasMatches ? `+ ${points}` : "Sem jogos"}
      </span>
    </div>
  );

  if (!hasMatches) {
    return <div className="opacity-60">{content}</div>;
  }

  return (
    <Link className="block rounded-xl hover:bg-sky-100" href={href}>
      {content}
    </Link>
  );
};

function getDaySummary(
  matches: MatchResult[],
  rankingItem: RankingItem,
  day: number,
  timeZone: string,
) {
  const matchIds = new Set(
    matches
      .filter((match) => getBetsDay(match.fixture.utcDate, timeZone) === day)
      .map((match) => match.id),
  );

  return {
    hasMatches: matchIds.size > 0,
    points: sumPoints(
      rankingItem.bets.filter((bet) => matchIds.has(bet.matchID)),
    ),
  };
}
