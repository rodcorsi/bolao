import { Config } from "../../lib/getConfig";
import { NextPhaseNotice as NextPhaseNoticeData } from "../../lib/tournamentPhase";
import React from "react";
import { formatPhaseDate } from "../../lib/formatDate";

interface NextPhaseNoticeProps {
  notice: NextPhaseNoticeData | null;
  config: Config;
}

const NextPhaseNotice: React.FC<NextPhaseNoticeProps> = ({
  notice,
  config,
}) => {
  if (!notice) {
    return null;
  }

  const opensAt = formatPhaseDate(
    notice.opensAt,
    config.locale,
    config.timeZone,
  );
  const closesAt = formatPhaseDate(
    notice.closesAt,
    config.locale,
    config.timeZone,
  );

  return (
    <section className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        Próxima fase
      </div>
      <p className="mt-1 text-sm text-amber-900">
        {`O preenchimento dos palpites para a fase `}
        <span className="font-bold">{notice.phaseLabel}</span>
        {` ficará disponível em `}
        <span className="font-bold">{opensAt}</span>
        {` e irá fechar `}
        <span className="font-bold">{closesAt}</span>
        {`.`}
      </p>
      <p className="mt-1 text-sm text-amber-900">
        Já coloca um alarme para não ficar de fora!
      </p>
    </section>
  );
};

export default NextPhaseNotice;
