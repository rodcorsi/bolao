import React, { FormEvent, useRef } from "react";

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
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const pendingSubmitEvent = useRef<FormEvent<HTMLFormElement> | null>(null);

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pendingSubmitEvent.current = event;
    confirmDialogRef.current?.showModal();
  };

  const handleConfirmCreate = () => {
    confirmDialogRef.current?.close();
    const event = pendingSubmitEvent.current;
    pendingSubmitEvent.current = null;
    if (event) {
      onCreatePlayer(event);
    }
  };

  const handleCancelCreate = () => {
    confirmDialogRef.current?.close();
    pendingSubmitEvent.current = null;
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {session.user.name}
          </h2>
          <p className="text-sm text-slate-600">
            CPF final {session.user.cpf.slice(-4)} • PIX {session.user.pixKey}
          </p>
        </div>
        {canCreatePlayer ? (
          <form
            onSubmit={handleCreateSubmit}
            className="flex w-full max-w-md gap-2"
          >
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Novo jogador"
              value={newPlayerName}
              onChange={(event) => onNewPlayerNameChange(event.target.value)}
            />
            <button
              disabled={!newPlayerName.trim()}
              className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
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

      <dialog
        ref={confirmDialogRef}
        onCancel={handleCancelCreate}
        className="m-auto rounded-2xl border border-slate-200 p-0 shadow-lg backdrop:bg-slate-900/40"
      >
        <div className="max-w-sm p-5">
          <p className="text-sm font-medium text-slate-800">
            Você realmente quer criar um novo jogador? Cada novo jogador será
            cobrado
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              autoFocus
              onClick={handleCancelCreate}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Não
            </button>
            <button
              type="button"
              onClick={handleConfirmCreate}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Sim
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
};

export default SessionPanel;
