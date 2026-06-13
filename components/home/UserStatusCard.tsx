import { MatchResult, RankingItem } from "../../lib/ranking";
import { useEffect, useState } from "react";

import ChangePosition from "../ChangePosition";
import Link from "next/link";
import { PlaySession } from "../../lib/play";
import Position from "../Position";
import React from "react";
import { sumPoints } from "../../lib/rankingSummary";

interface UserStatusCardProps {
  items: RankingItem[];
  matchesOfDay: MatchResult[];
  lastPosition: number;
}

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

const UserStatusCard: React.FC<UserStatusCardProps> = ({
  items,
  matchesOfDay,
  lastPosition,
}) => {
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
        // Sem sessão válida: não exibe o card.
      }
    };
    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!session) {
    return null;
  }

  const playerIds = new Set(session.players.map((player) => player.id));
  const userItems = items.filter((item) => playerIds.has(item.player.id));
  if (userItems.length === 0) {
    return null;
  }

  const dayMatchIds = new Set(matchesOfDay.map((match) => match.id));

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-linear-to-r from-slate-900 to-slate-700 px-4 py-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-base font-bold text-white ring-1 ring-white/25">
          {getInitials(session.user.name) || "?"}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            Seus jogos
          </div>
          <h2 className="truncate text-lg font-bold text-white">
            {session.user.name}
          </h2>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {userItems.map((item) => {
          const dayPoints = sumPoints(
            item.bets.filter((bet) => dayMatchIds.has(bet.matchID)),
          );
          return (
            <li
              key={item.player.id}
              className="flex items-center gap-3 px-3 py-3 transition hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <Position
                  position={item.position}
                  lastPosition={lastPosition}
                />
              </div>

              <div className="min-w-0 grow">
                <Link href={`/players/${item.player.id}`}>
                  <div className="truncate font-semibold text-slate-900">
                    {item.player.name}
                  </div>
                </Link>
              </div>

              <div className="flex flex-col items-center rounded-xl bg-sky-50 px-3 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-600"></span>
                <span className="text-lg font-black leading-tight text-sky-700">
                  <ChangePosition
                    className="inline-flex items-center font-medium"
                    position={item.position}
                    oldPosition={item.oldPosition}
                  />
                </span>
              </div>

              <div className="flex flex-col items-center rounded-xl bg-sky-50 px-3 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-600">
                  Dia
                </span>
                <span className="text-lg font-black leading-tight text-sky-700">
                  {`+ ${dayPoints}`}
                </span>
              </div>

              <div className="flex flex-col items-center rounded-xl bg-emerald-50 px-3 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                  Total
                </span>
                <span className="text-lg font-black leading-tight text-emerald-700">
                  {item.points}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default UserStatusCard;
