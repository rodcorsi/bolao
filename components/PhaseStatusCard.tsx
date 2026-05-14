import Link from "next/link";
import { Config } from "../lib/getConfig";
import { formatDateTime } from "../lib/formatDate";
import { PhaseState } from "../lib/tournamentPhase";

interface PhaseStatusCardProps {
  phaseState: PhaseState;
  config: Config;
}

const PhaseStatusCard: React.FC<PhaseStatusCardProps> = ({
  phaseState,
  config,
}) => {
  const hasOpenWindow = phaseState.editablePhase != null;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm mb-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Fase atual
          </div>
          <h2 className="text-2xl font-bold text-emerald-950">
            {phaseState.currentPhaseLabel}
          </h2>
          <p className="mt-1 text-sm text-emerald-900">
            {hasOpenWindow
              ? `Palpites abertos para ${phaseState.editablePhaseLabel}.`
              : "Nenhuma nova fase está aberta para palpites neste momento."}
          </p>
          {phaseState.editablePhaseLockAt ? (
            <p className="mt-2 text-sm text-emerald-800">
              Prazo final:{" "}
              {formatDateTime(
                phaseState.editablePhaseLockAt,
                config.locale,
                config.timeZone
              )}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <Link
            href="/play"
            className="rounded-full bg-emerald-700 px-4 py-2 text-center font-semibold text-white transition hover:bg-emerald-800"
          >
            {hasOpenWindow ? "Cadastrar ou editar palpites" : "Acompanhar status"}
          </Link>
          {config.tournament.rulesUrl ? (
            <Link
              href={config.tournament.rulesUrl}
              className="text-sm font-medium text-emerald-900 underline"
            >
              Regulamento
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default PhaseStatusCard;
