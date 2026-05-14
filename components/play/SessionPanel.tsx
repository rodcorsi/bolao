import React, { FormEvent } from "react";

import { PlaySession } from "../../lib/play";

interface SessionPanelProps {
  canCreatePlayer: boolean;
  newPlayerName: string;
  selectedPlayerId: number | null;
  session: PlaySession;
  onCreatePlayer: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onNewPlayerNameChange: (name: string) => void;
  onSelectPlayer: (playerId: number) => void;
}

const SessionPanel: React.FC<SessionPanelProps> = ({
  canCreatePlayer,
  newPlayerName,
  selectedPlayerId,
  session,
  onCreatePlayer,
  onNewPlayerNameChange,
  onSelectPlayer,
}) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{session.user.name}</h2>
          <p className="text-sm text-slate-600">
            CPF final {session.user.cpf.slice(-4)} • PIX {session.user.pixKey}
          </p>
        </div>
        {canCreatePlayer ? (
          <form onSubmit={onCreatePlayer} className="flex w-full max-w-md gap-2">
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Novo jogador"
              value={newPlayerName}
              onChange={(event) => onNewPlayerNameChange(event.target.value)}
            />
            <button className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white">
              Criar
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {session.players.map((player) => (
          <button
            key={player.id}
            type="button"
            onClick={() => onSelectPlayer(player.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              selectedPlayerId === player.id
                ? "bg-emerald-700 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
    </section>
  );
};

export default SessionPanel;
