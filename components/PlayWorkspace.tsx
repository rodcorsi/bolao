import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Bet } from "../lib/getBets";
import { Config } from "../lib/getConfig";
import TeamCrest from "./TeamCrest";
import { MatchResult } from "../lib/ranking";
import { PhaseState } from "../lib/tournamentPhase";
import { PlaySession } from "../lib/play";
import {
  SessionCredentials,
  loadPlayAuth,
  savePlayAuth,
} from "../lib/playAuthStorage";
import { formatDateTime } from "../lib/formatDate";

interface PlayWorkspaceProps {
  config: Config;
  phaseState: PhaseState;
  matches: MatchResult[];
  initialCredentials?: SessionCredentials;
  initialSession?: PlaySession | null;
  showSignupLink?: boolean;
}

const emptyCredentials = {
  cpf: "",
  secretCode: "",
};

const sanitizeCPF = (value: string) => value.replace(/\D/g, "").slice(0, 11);

const Spinner: React.FC = () => (
  <span
    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    aria-hidden="true"
  />
);

const PlayWorkspace: React.FC<PlayWorkspaceProps> = ({
  config,
  phaseState,
  matches,
  initialCredentials = emptyCredentials,
  initialSession = null,
  showSignupLink = true,
}) => {
  const [credentials, setCredentials] =
    useState<SessionCredentials>(initialCredentials);
  const [session, setSession] = useState<PlaySession | null>(initialSession);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [betForm, setBetForm] = useState<Record<number, { home: string; away: string }>>(
    {}
  );
  const [isOpeningSession, setIsOpeningSession] = useState(false);
  const [isSavingBets, setIsSavingBets] = useState(false);
  const [hasRestoredStoredAuth, setHasRestoredStoredAuth] = useState(false);
  const canCreatePlayer = phaseState.currentPhase === "INICIO";

  useEffect(() => {
    setCredentials(initialCredentials);
  }, [initialCredentials]);

  useEffect(() => {
    setSession(initialSession);
    if (initialSession) {
      refreshBetForm(initialSession);
    }
  }, [initialSession, matches]);

  const selectedPlayer = useMemo(() => {
    if (!session || selectedPlayerId == null) {
      return null;
    }
    return session.players.find((player) => player.id === selectedPlayerId) || null;
  }, [session, selectedPlayerId]);

  const refreshBetForm = (nextSession: PlaySession | null, playerId?: number | null) => {
    const currentPlayerId =
      playerId ?? nextSession?.players[0]?.id ?? null;
    setSelectedPlayerId(currentPlayerId);
    const player = nextSession?.players.find((item) => item.id === currentPlayerId);
    const nextValues: Record<number, { home: string; away: string }> = {};
    for (const match of matches) {
      const bet = player?.bets.find((item) => item.matchID === match.id);
      nextValues[match.id] = {
        home: bet ? String(bet.homeGoals) : "",
        away: bet ? String(bet.awayGoals) : "",
      };
    }
    setBetForm(nextValues);
  };

  const handleSession = (nextSession: PlaySession, nextCredentials: SessionCredentials) => {
    setCredentials(nextCredentials);
    setSession(nextSession);
    setErrorMessage(null);
    setStatusMessage("Sessão carregada.");
    refreshBetForm(nextSession);
    savePlayAuth(nextCredentials);
  };

  const requestJSON = async <T,>(url: string, body: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Não foi possível completar a operação.");
    }
    return payload as T;
  };

  const openSession = async (
    nextCredentials: SessionCredentials,
    options?: { silent?: boolean }
  ) => {
    setIsOpeningSession(true);
    setErrorMessage(null);
    if (!options?.silent) {
      setStatusMessage(null);
    }
    try {
      const payload = await requestJSON<{ session: PlaySession }>(
        "/api/users/session",
        nextCredentials
      );
      handleSession(payload.session, nextCredentials);
    } catch (error) {
      if (!options?.silent) {
        setErrorMessage(
          error instanceof Error ? error.message : "Erro ao abrir sessão."
        );
      }
    } finally {
      setIsOpeningSession(false);
    }
  };

  useEffect(() => {
    if (hasRestoredStoredAuth || session || initialSession) {
      return;
    }
    const storedCredentials = loadPlayAuth();
    setHasRestoredStoredAuth(true);
    if (!storedCredentials) {
      return;
    }
    setCredentials(storedCredentials);
    void openSession(storedCredentials, { silent: true });
  }, [hasRestoredStoredAuth, initialSession, session]);

  const handleOpenSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await openSession(credentials);
  };

  const handleCreatePlayer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = await requestJSON<{ session: PlaySession }>(
        "/api/players",
        {
          ...credentials,
          playerName: newPlayerName,
        }
      );
      setSession(payload.session);
      setNewPlayerName("");
      setStatusMessage("Jogador criado.");
      refreshBetForm(payload.session, payload.session.players[payload.session.players.length - 1]?.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao criar jogador."
      );
    }
  };

  const handleSaveBets = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPlayer || !phaseState.editablePhase) {
      return;
    }
    setIsSavingBets(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const bets: Bet[] = matches.map((match) => ({
        playerID: selectedPlayer.id,
        matchID: match.id,
        homeGoals: Number(betForm[match.id]?.home),
        awayGoals: Number(betForm[match.id]?.away),
      }));
      const payload = await requestJSON<{ session: PlaySession }>(
        "/api/bets/upsert",
        {
          ...credentials,
          playerId: selectedPlayer.id,
          editablePhase: phaseState.editablePhase,
          bets,
        }
      );
      setSession(payload.session);
      setStatusMessage("Palpites salvos.");
      refreshBetForm(payload.session, selectedPlayer.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao salvar palpites."
      );
    } finally {
      setIsSavingBets(false);
    }
  };

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Status da rodada</h2>
        <p className="mt-2 text-sm text-slate-700">
          Fase atual: <strong>{phaseState.currentPhaseLabel}</strong>
        </p>
        <p className="mt-1 text-sm text-slate-700">
          {phaseState.editablePhase
            ? `Palpites abertos para ${phaseState.editablePhaseLabel}.`
            : "Nenhuma fase está aberta para novos palpites."}
        </p>
        {phaseState.editablePhaseLockAt ? (
          <p className="mt-1 text-sm text-slate-700">
            Prazo final:{" "}
            {formatDateTime(
              phaseState.editablePhaseLockAt,
              config.locale,
              config.timeZone
            )}
          </p>
        ) : null}
      </section>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      {statusMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      <div className="grid gap-4">
        <form
          onSubmit={handleOpenSession}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h2 className="text-xl font-bold text-slate-900">Reabrir cadastro</h2>
          <p className="mt-1 text-sm text-slate-600">
            Use CPF e Senha para editar jogadores e palpites até o prazo.
          </p>
          {showSignupLink ? (
            <p className="mt-2 text-sm text-slate-600">
              Ainda não tem cadastro?{" "}
              <Link href="/signup" className="font-semibold text-emerald-700 underline">
                Criar agora
              </Link>
            </p>
          ) : null}
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="CPF"
              inputMode="numeric"
              pattern="[0-9]{11}"
              minLength={11}
              maxLength={11}
              required
              value={credentials.cpf}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  cpf: sanitizeCPF(event.target.value),
                }))
              }
            />
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Senha"
              type="password"
              minLength={6}
              maxLength={256}
              required
              value={credentials.secretCode}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  secretCode: event.target.value,
                }))
              }
            />
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isOpeningSession}
            >
              {isOpeningSession ? <Spinner /> : null}
              {isOpeningSession ? "Abrindo sessão..." : "Abrir sessão"}
            </button>
          </div>
        </form>
      </div>

      {session ? (
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
              <form onSubmit={handleCreatePlayer} className="flex w-full max-w-md gap-2">
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="Novo jogador"
                  value={newPlayerName}
                  onChange={(event) => setNewPlayerName(event.target.value)}
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
                onClick={() => refreshBetForm(session, player.id)}
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
      ) : null}

      {session && selectedPlayer && phaseState.editablePhase ? (
        <form
          onSubmit={handleSaveBets}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h2 className="text-xl font-bold text-slate-900">
            Palpites de {selectedPlayer.name} para {phaseState.editablePhaseLabel}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            É obrigatório preencher todos os jogos da fase antes do prazo final.
          </p>
          <div className="mt-4 grid gap-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_auto_auto_1fr]"
              >
                <div className="flex items-center font-medium text-slate-800">
                  <TeamCrest
                    crest={match.fixture.homeTeam.crest}
                    teamName={match.homeTeam}
                  />
                  <span>{match.homeTeam}</span>
                </div>
                <input
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  value={betForm[match.id]?.home || ""}
                  onChange={(event) =>
                    setBetForm((current) => ({
                      ...current,
                      [match.id]: {
                        home: event.target.value,
                        away: current[match.id]?.away || "",
                      },
                    }))
                  }
                />
                <input
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  value={betForm[match.id]?.away || ""}
                  onChange={(event) =>
                    setBetForm((current) => ({
                      ...current,
                      [match.id]: {
                        home: current[match.id]?.home || "",
                        away: event.target.value,
                      },
                    }))
                  }
                />
                <div className="flex items-center justify-start font-medium text-slate-800 md:justify-end">
                  <span>{match.awayTeam}</span>
                  <TeamCrest
                    crest={match.fixture.awayTeam.crest}
                    teamName={match.awayTeam}
                  />
                </div>
                <div className="text-xs text-slate-500 md:col-span-4">
                  {formatDateTime(
                    match.fixture.utcDate,
                    config.locale,
                    config.timeZone
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSavingBets}
          >
            {isSavingBets ? <Spinner /> : null}
            {isSavingBets ? "Salvando palpites..." : "Salvar palpites"}
          </button>
        </form>
      ) : null}
    </div>
  );
};

export default PlayWorkspace;
