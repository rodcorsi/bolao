import React, { FormEvent } from "react";

import TeamCrest from "../TeamCrest";
import { Config } from "../../lib/getConfig";
import { formatDateTime } from "../../lib/formatDate";
import { MatchResult } from "../../lib/ranking";
import { CompetitionPhase } from "../../lib/tournamentPhase";
import { PlayPlayer } from "../../lib/play";
import LoadingSpinner from "./LoadingSpinner";

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
  isSavingBets,
  matches,
  selectedPlayer,
  onSubmit,
  onChangeBet,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-xl font-bold text-slate-900">
        Palpites de {selectedPlayer.name} para {editablePhaseLabel}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        É obrigatório preencher todos os jogos da fase antes do prazo final.
      </p>
      <input type="hidden" name="editablePhase" value={editablePhase} />
      <div className="mt-4 grid gap-3">
        {matches.map((match) => (
          <div
            key={match.id}
            className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_auto_auto_1fr]"
          >
            <div className="flex items-center font-medium text-slate-800">
              <TeamCrest crest={match.fixture.homeTeam.crest} teamName={match.homeTeam} />
              <span>{match.homeTeam}</span>
            </div>
            <input
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={betForm[match.id]?.home || ""}
              onChange={(event) => onChangeBet(match.id, "home", event.target.value)}
            />
            <input
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={betForm[match.id]?.away || ""}
              onChange={(event) => onChangeBet(match.id, "away", event.target.value)}
            />
            <div className="flex items-center justify-start font-medium text-slate-800 md:justify-end">
              <span>{match.awayTeam}</span>
              <TeamCrest crest={match.fixture.awayTeam.crest} teamName={match.awayTeam} />
            </div>
            <div className="text-xs text-slate-500 md:col-span-4">
              {formatDateTime(match.fixture.utcDate, config.locale, config.timeZone)}
            </div>
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
