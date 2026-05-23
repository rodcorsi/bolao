import React, { FormEvent } from "react";

import TeamCrest from "../TeamCrest";
import { Config } from "../../lib/getConfig";
import { formatDateTime } from "../../lib/formatDate";
import { MatchResult } from "../../lib/ranking";
import { CompetitionPhase } from "../../lib/tournamentPhase";
import { PlayPlayer } from "../../lib/play";
import LoadingSpinner from "./LoadingSpinner";
import ScoreInput from "./ScoreInput";

export interface BetFormState {
  [matchId: number]: {
    home: string;
    away: string;
  };
}

interface BetsEditorProps {
  betForm: BetFormState;
  config: Config;
  editablePhase: CompetitionPhase;
  editablePhaseLabel: string;
  invalidMatchIds: number[];
  isSavingBets: boolean;
  matches: MatchResult[];
  selectedPlayer: PlayPlayer;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onChangeBet: (matchId: number, side: "home" | "away", value: string) => void;
}

const BetsEditor: React.FC<BetsEditorProps> = ({
  betForm,
  config,
  editablePhase,
  editablePhaseLabel,
  invalidMatchIds,
  isSavingBets,
  matches,
  selectedPlayer,
  onSubmit,
  onChangeBet,
}) => {
  const invalidMatchIdSet = new Set(invalidMatchIds);

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-xl font-bold text-slate-900">
        Palpites de {selectedPlayer.name} para {editablePhaseLabel}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Voce pode deixar jogos em branco. Se preencher um lado, precisa preencher o outro.
      </p>
      <input type="hidden" name="editablePhase" value={editablePhase} />
      <div className="mt-4 grid gap-3">
        {matches.map((match) => (
          <div
            key={match.id}
            className={`rounded-xl border p-3 ${
              invalidMatchIdSet.has(match.id)
                ? "border-red-300 bg-red-50"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <div className="min-w-0 flex-1 text-right text-ellipsis whitespace-nowrap overflow-hidden">
                {match.homeTeam}
              </div>
              <TeamCrest crest={match.fixture.homeTeam.crest} teamName={match.homeTeam} />
              <ScoreInput
                ariaLabel={`Placar do ${match.homeTeam}`}
                value={betForm[match.id]?.home || ""}
                onChange={(value) => onChangeBet(match.id, "home", value)}
              />
              <div className="shrink-0 text-xs text-slate-500">x</div>
              <ScoreInput
                ariaLabel={`Placar do ${match.awayTeam}`}
                value={betForm[match.id]?.away || ""}
                onChange={(value) => onChangeBet(match.id, "away", value)}
              />
              <TeamCrest crest={match.fixture.awayTeam.crest} teamName={match.awayTeam} />
              <div className="min-w-0 flex-1 text-ellipsis whitespace-nowrap overflow-hidden">
                {match.awayTeam}
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {formatDateTime(match.fixture.utcDate, config.locale, config.timeZone)}
            </div>
            {invalidMatchIdSet.has(match.id) ? (
              <div className="mt-1 text-xs text-red-700">
                Preencha os dois placares ou deixe ambos em branco.
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <button
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSavingBets}
      >
        {isSavingBets ? <LoadingSpinner /> : null}
        {isSavingBets ? "Salvando palpites..." : "Salvar palpites"}
      </button>
    </form>
  );
};

export default BetsEditor;
