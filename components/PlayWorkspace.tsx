import BetsEditor, { BetFormState } from "./play/BetsEditor";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  SessionCredentials,
  loadPlayAuth,
  savePlayAuth,
} from "../lib/playAuthStorage";

import { Bet } from "../lib/getBets";
import { Config } from "../lib/getConfig";
import { MatchResult } from "../lib/ranking";
import OpenSessionForm from "./play/OpenSessionForm";
import { PhaseState } from "../lib/tournamentPhase";
import PhaseStatusPanel from "./play/PhaseStatusPanel";
import { PlaySession } from "../lib/play";
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
  if (
    !Number.isInteger(numericValue) ||
    numericValue < 0 ||
    numericValue > 99
  ) {
    return Number.NaN;
  }
  return numericValue;
}

function buildBetForm(
  matches: MatchResult[],
  nextSession: PlaySession | null,
  playerId: number | null,
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
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [warningVisible, setWarningVisible] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(
    initialPlayerId,
  );
  const [newPlayerName, setNewPlayerName] = useState("");
  const [betForm, setBetForm] = useState<BetFormState>(() =>
    buildBetForm(matches, initialSession, initialPlayerId),
  );
  const [invalidBetMatchIds, setInvalidBetMatchIds] = useState<number[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isOpeningSession, setIsOpeningSession] = useState(false);
  const [isSavingBets, setIsSavingBets] = useState(false);
  const [hasRestoredStoredAuth, setHasRestoredStoredAuth] = useState(false);
  const [isRestoringStoredAuth, setIsRestoringStoredAuth] = useState(false);
  const canCreatePlayer = phaseState.currentPhase === "INICIO";
  const shouldShowOpenSessionForm =
    !session && hasRestoredStoredAuth && !isRestoringStoredAuth;

  const refreshBetForm = useCallback(
    (nextSession: PlaySession | null, playerId?: number | null) => {
      const currentPlayerId = playerId ?? nextSession?.players[0]?.id ?? null;
      setSelectedPlayerId(currentPlayerId);
      setBetForm(buildBetForm(matches, nextSession, currentPlayerId));
      setInvalidBetMatchIds([]);
      setWarningMessage(null);
      setWarningVisible(false);
      setIsDirty(false);
    },
    [matches],
  );

  const selectedPlayer = useMemo(() => {
    if (!session || selectedPlayerId == null) {
      return null;
    }
    return (
      session.players.find((player) => player.id === selectedPlayerId) || null
    );
  }, [session, selectedPlayerId]);

  const requestJSON = useCallback(
    async <T,>(url: string, body: Record<string, unknown>) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload.error || "Não foi possível completar a operação.",
        );
      }
      return payload as T;
    },
    [],
  );

  const handleSession = useCallback(
    (nextSession: PlaySession, nextCredentials: SessionCredentials) => {
      setCredentials(nextCredentials);
      setSession(nextSession);
      setErrorMessage(null);
      setStatusMessage(null);
      setWarningMessage(null);
      setWarningVisible(false);
      refreshBetForm(nextSession);
      savePlayAuth(nextCredentials);
    },
    [refreshBetForm],
  );

  const openSession = useCallback(
    async (
      nextCredentials: SessionCredentials,
      options?: { silent?: boolean },
    ) => {
      setIsOpeningSession(true);
      setErrorMessage(null);
      if (!options?.silent) {
        setStatusMessage(null);
        setWarningMessage(null);
        setWarningVisible(false);
      }
      try {
        const payload = await requestJSON<{ session: PlaySession }>(
          "/api/users/session",
          nextCredentials,
        );
        handleSession(payload.session, nextCredentials);
      } catch (error) {
        if (!options?.silent) {
          setErrorMessage(
            error instanceof Error ? error.message : "Erro ao abrir sessão.",
          );
        }
      } finally {
        setIsOpeningSession(false);
      }
    },
    [handleSession, requestJSON],
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
      await openSession(storedCredentials || { cpf: "", secretCode: "" }, {
        silent: true,
      });
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

  useEffect(() => {
    if (!warningMessage) {
      return;
    }
    // Desliza para dentro no próximo frame (após renderizar escondido no topo).
    const enter = requestAnimationFrame(() =>
      requestAnimationFrame(() => setWarningVisible(true)),
    );
    // Desliza para fora e, ao fim da transição, remove o toast.
    const hideTimer = setTimeout(() => setWarningVisible(false), 5700);
    const clearTimer = setTimeout(() => setWarningMessage(null), 6000);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(hideTimer);
      clearTimeout(clearTimer);
    };
  }, [warningMessage]);

  const handleOpenSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await openSession(credentials);
  };

  const handleChangeBet = (
    matchId: number,
    side: "home" | "away",
    value: string,
  ) => {
    setIsDirty(true);
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
        },
      );
      setSession(payload.session);
      setNewPlayerName("");
      setStatusMessage("Jogador criado.");
      refreshBetForm(
        payload.session,
        payload.session.players[payload.session.players.length - 1]?.id,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao criar jogador.",
      );
    }
  };

  const handleUpdateUserName = async (name: string) => {
    try {
      const payload = await requestJSON<{ session: PlaySession }>(
        "/api/users/name",
        {
          ...credentials,
          name,
        },
      );
      setSession(payload.session);
      setErrorMessage(null);
      setStatusMessage("Nome atualizado.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao atualizar nome.",
      );
      throw error;
    }
  };

  const handleSaveBets = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPlayer || !phaseState.editablePhase) {
      return;
    }
    setErrorMessage(null);
    setStatusMessage(null);
    setWarningMessage(null);
    setWarningVisible(false);
    let unfilledCount = 0;
    let invalidCount = 0;
    const bets: Bet[] = matches.map((match) => {
      const rawHome = betForm[match.id]?.home?.trim() ?? "";
      const rawAway = betForm[match.id]?.away?.trim() ?? "";
      const homeGoals = parseBetField(rawHome);
      const awayGoals = parseBetField(rawAway);
      const isHomeValid = homeGoals != null && !Number.isNaN(homeGoals);
      const isAwayValid = awayGoals != null && !Number.isNaN(awayGoals);
      const isComplete = isHomeValid && isAwayValid;
      if (!isComplete) {
        if (rawHome === "" && rawAway === "") {
          unfilledCount += 1;
        } else {
          invalidCount += 1;
        }
      }
      return {
        playerID: selectedPlayer.id,
        matchID: match.id,
        homeGoals: isComplete ? homeGoals : null,
        awayGoals: isComplete ? awayGoals : null,
      };
    });
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
        },
      );
      setSession(payload.session);
      refreshBetForm(payload.session, selectedPlayer.id);
      setStatusMessage("Palpites salvos.");
      const warningParts: string[] = [];
      if (unfilledCount > 0) {
        warningParts.push(`${unfilledCount} jogo(s) sem placar`);
      }
      if (invalidCount > 0) {
        warningParts.push(`${invalidCount} jogo(s) com placar inválido`);
      }
      // Definido após refreshBetForm, que limpa warningMessage.
      if (warningParts.length > 0) {
        setWarningMessage(
          `Atenção: ${warningParts.join(" e ")} foram salvos em branco.`,
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao salvar palpites.",
      );
    } finally {
      setIsSavingBets(false);
    }
  };

  return (
    <div className="grid gap-4">
      {warningMessage ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed inset-x-0 top-2 z-50 mx-auto w-full max-w-md transform px-0 transition-all duration-300 ease-out sm:px-2 ${
            warningVisible
              ? "translate-y-0 opacity-100"
              : "-translate-y-[150%] opacity-0"
          }`}
        >
          <div className="border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-lg sm:rounded-xl sm:border">
            {warningMessage}
          </div>
        </div>
      ) : null}
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
          onUpdateUserName={handleUpdateUserName}
        />
      ) : null}

      {session && selectedPlayer && phaseState.editablePhase ? (
        <BetsEditor
          betForm={betForm}
          config={config}
          editablePhase={phaseState.editablePhase}
          editablePhaseLabel={phaseState.editablePhaseLabel || ""}
          invalidMatchIds={invalidBetMatchIds}
          isDirty={isDirty}
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
