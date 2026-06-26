import { MatchResult, RankingItem } from "../lib/ranking";
import React, { useEffect, useState } from "react";

import Link from "next/link";
import MatchHeader from "./MatchHeader";
import { PlaySession } from "../lib/play";
import Point from "./Point";
import { selectGoals } from "../lib/getFootballFixture";

interface ListActiveMatchesWithUserBetsProps {
  matches: MatchResult[];
  rankingItems: RankingItem[];
  className?: string;
}

const formatBet = (homeGoals: number | null, awayGoals: number | null) => {
  if (homeGoals == null || awayGoals == null) {
    return "Sem palpite";
  }
  return `${homeGoals} x ${awayGoals}`;
};

const ListActiveMatchesWithUserBets: React.FC<
  ListActiveMatchesWithUserBetsProps
> = ({ matches, rankingItems, className }) => {
  const [session, setSession] = useState<PlaySession | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      try {
        const response = await fetch("/api/users/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { session: PlaySession };
        if (!cancelled) {
          setSession(payload.session);
        }
      } catch {
        // Sem sessão válida: mantém a área reservada sem exibir palpites.
      }
    };
    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const playerIds = new Set(session?.players.map((player) => player.id) ?? []);
  const userItems = session
    ? rankingItems.filter((item) => playerIds.has(item.player.id))
    : [];

  return (
    <div className={className}>
      {matches.map((match) => {
        const goals = selectGoals(match.fixture);
        const hasResult = goals.homeTeam != null && goals.awayTeam != null;
        return (
          <article
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            key={match.id}
          >
            <Link href={`/matches/${match.id}`}>
              <MatchHeader
                className="hover:bg-slate-200"
                match={match}
                homeGoals={goals.homeTeam}
                awayGoals={goals.awayTeam}
              />
            </Link>
            <div className="h-14 overflow-y-auto border-t border-gray-100 bg-slate-50 px-3 py-2">
              {userItems.length > 0 ? (
                <ul className="space-y-1">
                  {userItems.map((item) => {
                    const bet = item.bets.find(
                      (itemBet) => itemBet.matchID === match.id,
                    );
                    return (
                      <li
                        className="flex items-center justify-end gap-2 text-xs text-slate-700"
                        key={item.player.id}
                      >
                        <span className="min-w-0 truncate font-medium">
                          {item.player.name}
                        </span>
                        {hasResult ? (
                          <Point className="w-5" points={bet?.points} />
                        ) : (
                          <span className="w-5 text-center">--</span>
                        )}
                        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 italic font-bold text-slate-900 ring-1 ring-slate-400">
                          {bet
                            ? formatBet(bet.homeGoals, bet.awayGoals)
                            : "Sem palpite"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="h-full" />
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default ListActiveMatchesWithUserBets;
