import React, { FormEvent } from "react";

import { CompetitionPhase } from "../../lib/tournamentPhase";
import { Config } from "../../lib/getConfig";
import LoadingSpinner from "./LoadingSpinner";
import { MatchResult } from "../../lib/ranking";
import { PlayPlayer } from "../../lib/play";
import ScoreInput from "./ScoreInput";
import TeamCrest from "../TeamCrest";
import { formatDateTime } from "../../lib/formatDate";
import { t } from "../../lib/translate";

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
  isDirty: boolean;
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
  isDirty,
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
        Voce pode deixar jogos em branco. Se preencher um lado, precisa
        preencher o outro.
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
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-800">
              <TeamCrest
                crest={match.fixture.homeTeam.crest}
                teamName={match.homeTeam}
              />
              <ScoreInput
                ariaLabel={`Placar do ${t(match.homeTeam)}`}
                value={betForm[match.id]?.home || ""}
                onChange={(value) => onChangeBet(match.id, "home", value)}
              />
              <div className="shrink-0 text-xs text-slate-500">x</div>
              <ScoreInput
                ariaLabel={`Placar do ${t(match.awayTeam)}`}
                value={betForm[match.id]?.away || ""}
                onChange={(value) => onChangeBet(match.id, "away", value)}
              />
              <TeamCrest
                crest={match.fixture.awayTeam.crest}
                teamName={match.awayTeam}
              />
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <div className="min-w-0 flex-1 text-right text-ellipsis whitespace-nowrap overflow-hidden">
                {t(match.homeTeam)}
              </div>
              <div className="shrink-0 text-xs text-slate-500">x</div>
              <div className="min-w-0 flex-1 text-ellipsis whitespace-nowrap overflow-hidden">
                {t(match.awayTeam)}
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {formatDateTime(
                match.fixture.utcDate,
                config.locale,
                config.timeZone,
              )}
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
        type="submit"
        className={`fixed bottom-4 left-4 z-40 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold text-white shadow-lg transition ${
          isSavingBets
            ? "cursor-not-allowed bg-emerald-700 opacity-70"
            : isDirty
              ? "bg-emerald-700 hover:bg-emerald-800"
              : "cursor-not-allowed bg-slate-400"
        }`}
        disabled={isSavingBets || !isDirty}
      >
        {isSavingBets ? <LoadingSpinner /> : null}
        {isSavingBets
          ? "Salvando palpites..."
          : isDirty
            ? "Salvar palpites"
            : "Salvo"}
      </button>
    </form>
  );
};

export default BetsEditor;
