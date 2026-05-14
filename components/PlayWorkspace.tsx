import { FormEvent, useMemo, useState } from "react";

import { Bet } from "../lib/getBets";
import { Config } from "../lib/getConfig";
import { MatchResult } from "../lib/ranking";
import { PhaseState } from "../lib/tournamentPhase";
import { PlaySession } from "../lib/play";
import { formatDateTime } from "../lib/formatDate";

interface PlayWorkspaceProps {
  config: Config;
  phaseState: PhaseState;
  matches: MatchResult[];
}

type SessionCredentials = {
  cpf: string;
  secretCode: string;
};

const emptyCredentials = {
  cpf: "",
  secretCode: "",
};

const PlayWorkspace: React.FC<PlayWorkspaceProps> = ({
  config,
  phaseState,
  matches,
}) => {
  const [credentials, setCredentials] =
    useState<SessionCredentials>(emptyCredentials);
  const [session, setSession] = useState<PlaySession | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    cpf: "",
    pixKey: "",
    secretCode: "",
    playerName: "",
  });
  const [newPlayerName, setNewPlayerName] = useState("");
  const [betForm, setBetForm] = useState<Record<number, { home: string; away: string }>>(
    {}
  );

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

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = await requestJSON<{ session: PlaySession }>(
        "/api/users/register",
        registerForm
      );
      handleSession(payload.session, {
        cpf: registerForm.cpf,
        secretCode: registerForm.secretCode,
      });
      setStatusMessage("Cadastro criado com sucesso.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao cadastrar.");
    }
  };

  const handleOpenSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = await requestJSON<{ session: PlaySession }>(
        "/api/users/session",
        credentials
      );
      handleSession(payload.session, credentials);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao abrir sessão.");
    }
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

      <div className="grid gap-4 lg:grid-cols-2">
        <form
          onSubmit={handleRegister}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h2 className="text-xl font-bold text-slate-900">Novo cadastro</h2>
          <p className="mt-1 text-sm text-slate-600">
            Cadastre o usuário, crie o primeiro jogador e libere o preenchimento da
            fase aberta.
          </p>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Nome"
              value={registerForm.name}
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="CPF"
              value={registerForm.cpf}
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  cpf: event.target.value,
                }))
              }
            />
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Chave do PIX"
              value={registerForm.pixKey}
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  pixKey: event.target.value,
                }))
              }
            />
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Senha"
              type="password"
              value={registerForm.secretCode}
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  secretCode: event.target.value,
                }))
              }
            />
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Nome do jogador"
              value={registerForm.playerName}
              onChange={(event) =>
                setRegisterForm((current) => ({
                  ...current,
                  playerName: event.target.value,
                }))
              }
            />
            <button className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white">
              Criar cadastro
            </button>
          </div>
        </form>

        <form
          onSubmit={handleOpenSession}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h2 className="text-xl font-bold text-slate-900">Reabrir cadastro</h2>
          <p className="mt-1 text-sm text-slate-600">
            Use CPF e Senha para editar jogadores e palpites até o prazo.
          </p>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="CPF"
              value={credentials.cpf}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  cpf: event.target.value,
                }))
              }
            />
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Senha"
              type="password"
              value={credentials.secretCode}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  secretCode: event.target.value,
                }))
              }
            />
            <button className="rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white">
              Abrir sessão
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
                <div className="font-medium text-slate-800">{match.homeTeam}</div>
                <input
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center"
                  inputMode="numeric"
                  min={0}
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
                  inputMode="numeric"
                  min={0}
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
                <div className="font-medium text-slate-800 md:text-right">
                  {match.awayTeam}
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
          <button className="mt-4 rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white">
            Salvar palpites
          </button>
        </form>
      ) : null}
    </div>
  );
};

export default PlayWorkspace;
