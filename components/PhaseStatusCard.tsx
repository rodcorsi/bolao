import { Config } from "../lib/getConfig";
import Link from "next/link";
import { PhaseState } from "../lib/tournamentPhase";
import PixPayment from "./PixPayment";
import { formatDateTime } from "../lib/formatDate";

interface PhaseStatusCardProps {
  phaseState: PhaseState;
  config: Config;
  isAuthenticated?: boolean;
}

const PhaseStatusCard: React.FC<PhaseStatusCardProps> = ({
  phaseState,
  config,
  isAuthenticated = false,
}) => {
  const hasOpenWindow = phaseState.editablePhase != null;
  const canSignup = phaseState.currentPhase === "INICIO";

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
                config.timeZone,
              )}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          {canSignup && !isAuthenticated ? (
            <Link
              href="/signup"
              className="rounded-full bg-emerald-700 px-4 py-2 text-center font-semibold text-white transition hover:bg-emerald-800"
            >
              Criar cadastro
            </Link>
          ) : (
            <Link
              href="/play"
              className="rounded-full bg-emerald-700 px-4 py-2 text-center font-semibold text-white transition hover:bg-emerald-800"
            >
              {hasOpenWindow ? "Editar palpites" : "Acompanhar status"}
            </Link>
          )}
          <Link
            href="https://chat.whatsapp.com/IDFnXpCq09dKNgbzeBlk14"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-[#25D366] px-4 py-2 text-center font-semibold text-white transition hover:bg-[#1ebe5d]"
          >
            Entrar No Grupo WhatsApp
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
      {canSignup && isAuthenticated ? <PixPayment config={config} /> : null}
    </section>
  );
};

export default PhaseStatusCard;
