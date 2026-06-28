import { BetFillProgress as BetFillProgressData } from "../../lib/betProgress";
import React from "react";

interface BetFillProgressProps {
  progress: BetFillProgressData | null;
  editablePhaseLabel: string | null;
}

const BetFillProgress: React.FC<BetFillProgressProps> = ({
  progress,
  editablePhaseLabel,
}) => {
  if (!progress) {
    return null;
  }

  const { totalPlayers, completePlayers, pending } = progress;
  const percent =
    totalPlayers > 0 ? Math.round((completePlayers / totalPlayers) * 100) : 0;

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Preenchimento{editablePhaseLabel ? ` — ${editablePhaseLabel}` : ""}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {`${completePlayers} de ${totalPlayers} completaram os palpites`}
      </p>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {pending.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-800">
            {`Ainda falta preencher (${pending.length})`}
          </h3>
          <ul className="mt-2 max-h-60 space-y-1 overflow-auto text-sm text-slate-700">
            {pending.map((item) => (
              <li
                key={`${item.userName}-${item.playerName}`}
                className="flex items-center gap-2"
              >
                <span className="font-medium">{item.playerName}</span>
                {item.userName !== item.playerName ? (
                  <span className="text-xs text-slate-500">
                    ({item.userName})
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm font-medium text-emerald-700">
          Todos já preencheram os palpites desta fase! 🎉
        </p>
      )}
    </section>
  );
};

export default BetFillProgress;
