import React, { FormEvent, useRef, useState } from "react";

import { PlaySession } from "../../lib/play";

interface SessionPanelProps {
  canCreatePlayer: boolean;
  newPlayerName: string;
  selectedPlayerId: number | null;
  session: PlaySession;
  onCreatePlayer: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onNewPlayerNameChange: (name: string) => void;
  onSelectPlayer: (playerId: number) => void;
  onUpdateUserName: (name: string) => Promise<void>;
}

const PencilIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-.878.508l-3.2.914a.5.5 0 0 1-.618-.618l.914-3.2a2 2 0 0 1 .508-.878l8.5-8.5Z" />
  </svg>
);

const SessionPanel: React.FC<SessionPanelProps> = ({
  canCreatePlayer,
  newPlayerName,
  selectedPlayerId,
  session,
  onCreatePlayer,
  onNewPlayerNameChange,
  onSelectPlayer,
  onUpdateUserName,
}) => {
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const pendingSubmitEvent = useRef<FormEvent<HTMLFormElement> | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(session.user.name);
  const [isSavingName, setIsSavingName] = useState(false);

  const startEditName = () => {
    setNameDraft(session.user.name);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === session.user.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await onUpdateUserName(trimmed);
      setIsEditingName(false);
    } catch {
      // Mantém o modo de edição aberto em caso de erro.
    } finally {
      setIsSavingName(false);
    }
  };

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
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                className="w-full max-w-xs rounded-xl border border-slate-300 px-3 py-1 text-xl font-bold text-slate-900"
                value={nameDraft}
                autoFocus
                disabled={isSavingName}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSaveName();
                  }
                }}
              />
            ) : (
              <h2 className="text-xl font-bold text-slate-900">
                {session.user.name}
              </h2>
            )}
            <button
              type="button"
              onClick={isEditingName ? handleSaveName : startEditName}
              disabled={isSavingName || (isEditingName && !nameDraft.trim())}
              aria-label={isEditingName ? "Salvar nome" : "Editar nome"}
              className={
                isEditingName
                  ? "rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                  : "inline-flex items-center rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              }
            >
              {isEditingName ? "Salvar" : <PencilIcon />}
            </button>
          </div>
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
