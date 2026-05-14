import Link from "next/link";
import React, { FormEvent } from "react";

import { SessionCredentials } from "../../lib/playAuthStorage";
import LoadingSpinner from "./LoadingSpinner";

interface OpenSessionFormProps {
  credentials: SessionCredentials;
  isOpeningSession: boolean;
  showSignupLink: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onChange: (credentials: SessionCredentials) => void;
}

const sanitizeCPF = (value: string) => value.replace(/\D/g, "").slice(0, 11);

const OpenSessionForm: React.FC<OpenSessionFormProps> = ({
  credentials,
  isOpeningSession,
  showSignupLink,
  onSubmit,
  onChange,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-xl font-bold text-slate-900">Reabrir cadastro</h2>
      <p className="mt-1 text-sm text-slate-600">
        Use CPF e Senha para editar jogadores e palpites até o prazo.
      </p>
      {showSignupLink ? (
        <p className="mt-2 text-sm text-slate-600">
          Ainda não tem cadastro?{" "}
          <Link href="/signup" className="font-semibold text-emerald-700 underline">
            Criar agora
          </Link>
        </p>
      ) : null}
      <div className="mt-4 grid gap-3">
        <input
          className="rounded-xl border border-slate-300 px-3 py-2"
          placeholder="CPF"
          inputMode="numeric"
          pattern="[0-9]{11}"
          minLength={11}
          maxLength={11}
          required
          value={credentials.cpf}
          onChange={(event) =>
            onChange({
              ...credentials,
              cpf: sanitizeCPF(event.target.value),
            })
          }
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Senha"
          type="password"
          minLength={6}
          maxLength={256}
          required
          value={credentials.secretCode}
          onChange={(event) =>
            onChange({
              ...credentials,
              secretCode: event.target.value,
            })
          }
        />
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isOpeningSession}
        >
          {isOpeningSession ? <LoadingSpinner /> : null}
          {isOpeningSession ? "Abrindo sessão..." : "Abrir sessão"}
        </button>
      </div>
    </form>
  );
};

export default OpenSessionForm;
