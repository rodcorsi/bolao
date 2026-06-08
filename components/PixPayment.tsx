import { useEffect, useState } from "react";

import { QRCodeSVG } from "qrcode.react";
import { Config } from "../lib/getConfig";
import { createStaticPix, hasError } from "pix-utils";

import { PlaySession } from "../lib/play";

interface PixPaymentProps {
  config: Config;
}

const buildPixBRCode = (session: PlaySession, config: Config): string | null => {
  if (session.user.isPaid === true) {
    return null;
  }
  const player = session.players[0];
  if (!player) {
    return null;
  }
  const pix = createStaticPix({
    merchantName: config.pix.merchantName,
    merchantCity: config.pix.merchantCity,
    pixKey: config.pix.pixKey,
    infoAdicional: `Bolão Copa - ${player.userName}`,
    txid: `BOLAO${player.id}`,
    transactionAmount: config.prize.GAME_VALUE * session.players.length,
  });
  if (hasError(pix)) {
    return null;
  }
  return pix.toBRCode();
};

const PixPayment: React.FC<PixPaymentProps> = ({ config }) => {
  const [brCode, setBrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      try {
        const response = await fetch("/api/users/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { session: PlaySession };
        if (!cancelled) {
          setBrCode(buildPixBRCode(payload.session, config));
        }
      } catch {
        // Sem sessão válida: não exibe o pagamento.
      }
    };
    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [config]);

  const handleCopy = async () => {
    if (!brCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(brCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível: ignora silenciosamente.
    }
  };

  if (!brCode) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4">
      <div className="text-sm font-semibold text-emerald-900">
        Pague sua inscrição via PIX
      </div>
      <QRCodeSVG value={brCode} size={180} marginSize={2} />
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        {copied ? "Copiado!" : "Copiar PIX copia e cola"}
      </button>
    </div>
  );
};

export default PixPayment;
