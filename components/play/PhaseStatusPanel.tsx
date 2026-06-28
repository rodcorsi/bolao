import React from "react";

import { Config } from "../../lib/getConfig";
import { formatDateTime } from "../../lib/formatDate";
import { PhaseState } from "../../lib/tournamentPhase";

interface PhaseStatusPanelProps {
  config: Config;
  phaseState: PhaseState;
}

const PhaseStatusPanel: React.FC<PhaseStatusPanelProps> = ({
  config,
  phaseState,
}) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Status da rodada</h2>
      <p className="mt-2 text-sm text-slate-700">
        Fase atual: <strong>{phaseState.playingPhaseLabel}</strong>
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
  );
};

export default PhaseStatusPanel;
