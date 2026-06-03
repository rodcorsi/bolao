import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Bet } from "../lib/getBets";
import { Config } from "../lib/getConfig";
import { MatchResult } from "../lib/ranking";
import { PhaseState } from "../lib/tournamentPhase";
import { PlaySession } from "../lib/play";
import {
  SessionCredentials,
  loadPlayAuth,
  savePlayAuth,
} from "../lib/playAuthStorage";
import BetsEditor, { BetFormState } from "./play/BetsEditor";
import OpenSessionForm from "./play/OpenSessionForm";
import PhaseStatusPanel from "./play/PhaseStatusPanel";
import SessionPanel from "./play/SessionPanel";

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

function parseBetField(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") {
    return null;
  }
  const numericValue = Number(trimmed);
  if (!Number.isInteger(numericValue) || numericValue < 0 || numericValue > 99) {
    return Number.NaN;
  }
  return numericValue;
}

function buildBetForm(
  matches: MatchResult[],
  nextSession: PlaySession | null,
  playerId: number | null
) {
  const player = nextSession?.players.find((item) => item.id === playerId);
  const nextValues: BetFormState = {};
  for (const match of matches) {
    const bet = player?.bets.find((item) => item.matchID === match.id);
    nextValues[match.id] = {
      home: bet?.homeGoals != null ? String(bet.homeGoals) : "",
      away: bet?.awayGoals != null ? String(bet.awayGoals) : "",
    };
  }
  return nextValues;
}

const PlayWorkspace: React.FC<PlayWorkspaceProps> = ({
  config,
  phaseState,
  matches,
  initialCredentials = emptyCredentials,
  initialSession = null,
  showSignupLink = true,
}) => {
  const initialPlayerId = initialSession?.players[0]?.id ?? null;
  const [credentials, setCredentials] =
    useState<SessionCredentials>(initialCredentials);
  const [session, setSession] = useState<PlaySession | null>(initialSession);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] =
    useState<number | null>(initialPlayerId);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [betForm, setBetForm] = useState<BetFormState>(() =>
    buildBetForm(matches, initialSession, initialPlayerId)
  );
  const [invalidBetMatchIds, setInvalidBetMatchIds] = useState<number[]>([]);
  const [isOpeningSession, setIsOpeningSession] = useState(false);
  const [isSavingBets, setIsSavingBets] = useState(false);
  const [hasRestoredStoredAuth, setHasRestoredStoredAuth] = useState(false);
  const [isRestoringStoredAuth, setIsRestoringStoredAuth] = useState(false);
  const canCreatePlayer = phaseState.currentPhase === "INICIO";
  const shouldShowOpenSessionForm =
    !session && hasRestoredStoredAuth && !isRestoringStoredAuth;

  const refreshBetForm = useCallback(
    (nextSession: PlaySession | null, playerId?: number | null) => {
      const currentPlayerId =
        playerId ?? nextSession?.players[0]?.id ?? null;
      setSelectedPlayerId(currentPlayerId);
      setBetForm(buildBetForm(matches, nextSession, currentPlayerId));
      setInvalidBetMatchIds([]);
    },
    [matches]
  );

  const selectedPlayer = useMemo(() => {
    if (!session || selectedPlayerId == null) {
      return null;
    }
    return session.players.find((player) => player.id === selectedPlayerId) || null;
  }, [session, selectedPlayerId]);

  const requestJSON = useCallback(async <T,>(url: string, body: Record<string, unknown>) => {
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
  }, []);

  const handleSession = useCallback(
    (nextSession: PlaySession, nextCredentials: SessionCredentials) => {
      setCredentials(nextCredentials);
      setSession(nextSession);
      setErrorMessage(null);
      setStatusMessage(null);
      refreshBetForm(nextSession);
      savePlayAuth(nextCredentials);
    },
    [refreshBetForm]
  );

  const openSession = useCallback(
    async (
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
    },
    [handleSession, requestJSON]
  );

  useEffect(() => {
    if (hasRestoredStoredAuth || session || initialSession) {
      return;
    }
    let cancelled = false;
    const restoreStoredAuth = async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      const storedCredentials = loadPlayAuth();
      if (storedCredentials) {
        setCredentials(storedCredentials);
      }
      setIsRestoringStoredAuth(true);
      await openSession(storedCredentials || { cpf: "", secretCode: "" }, { silent: true });
      if (!cancelled) {
        setIsRestoringStoredAuth(false);
        setHasRestoredStoredAuth(true);
      }
    };
    void restoreStoredAuth();
    return () => {
      cancelled = true;
    };
  }, [hasRestoredStoredAuth, initialSession, openSession, session]);

  const handleOpenSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await openSession(credentials);
  };

  const handleChangeBet = (matchId: number, side: "home" | "away", value: string) => {
    setInvalidBetMatchIds((current) => current.filter((id) => id !== matchId));
    setBetForm((current) => ({
      ...current,
      [matchId]: {
        home: side === "home" ? value : current[matchId]?.home || "",
        away: side === "away" ? value : current[matchId]?.away || "",
      },
    }));
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
    setErrorMessage(null);
    setStatusMessage(null);
    const invalidMatchIds: number[] = [];
    const bets: Bet[] = matches.map((match) => {
      const homeGoals = parseBetField(betForm[match.id]?.home);
      const awayGoals = parseBetField(betForm[match.id]?.away);
      const hasHomeGoals = homeGoals != null;
      const hasAwayGoals = awayGoals != null;
      if (
        Number.isNaN(homeGoals) ||
        Number.isNaN(awayGoals) ||
        hasHomeGoals !== hasAwayGoals
      ) {
        invalidMatchIds.push(match.id);
      }
      return {
        playerID: selectedPlayer.id,
        matchID: match.id,
        homeGoals: hasHomeGoals && hasAwayGoals ? homeGoals : null,
        awayGoals: hasHomeGoals && hasAwayGoals ? awayGoals : null,
      };
    });
    if (invalidMatchIds.length > 0) {
      setInvalidBetMatchIds(invalidMatchIds);
      setErrorMessage(
        "Existem jogos com placar incompleto ou inválido. Complete os dois lados ou deixe ambos em branco."
      );
      return;
    }
    setInvalidBetMatchIds([]);
    setIsSavingBets(true);
    try {
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
      <PhaseStatusPanel config={config} phaseState={phaseState} />

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

      {shouldShowOpenSessionForm ? (
        <div className="grid gap-4">
          <OpenSessionForm
            credentials={credentials}
            isOpeningSession={isOpeningSession}
            showSignupLink={showSignupLink}
            onSubmit={handleOpenSession}
            onChange={setCredentials}
          />
        </div>
      ) : null}

      {session ? (
        <SessionPanel
          canCreatePlayer={canCreatePlayer}
          newPlayerName={newPlayerName}
          selectedPlayerId={selectedPlayerId}
          session={session}
          onCreatePlayer={handleCreatePlayer}
          onNewPlayerNameChange={setNewPlayerName}
          onSelectPlayer={(playerId) => refreshBetForm(session, playerId)}
        />
      ) : null}

      {session && selectedPlayer && phaseState.editablePhase ? (
        <BetsEditor
          betForm={betForm}
          config={config}
          editablePhase={phaseState.editablePhase}
          editablePhaseLabel={phaseState.editablePhaseLabel || ""}
          invalidMatchIds={invalidBetMatchIds}
          isSavingBets={isSavingBets}
          matches={matches}
          selectedPlayer={selectedPlayer}
          onSubmit={handleSaveBets}
          onChangeBet={handleChangeBet}
        />
      ) : null}
    </div>
  );
};

export default PlayWorkspace;
