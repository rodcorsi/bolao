import { FormEvent, useState } from "react";

import { SessionCredentials } from "../lib/playAuthStorage";
import { defaultPlayerName } from "../lib/playerDisplayName";

interface SignupFormProps {
  onRegistered: (credentials: SessionCredentials) => void;
}

const sanitizeCPF = (value: string) => value.replace(/\D/g, "").slice(0, 11);

const Spinner: React.FC = () => (
  <span
    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    aria-hidden="true"
  />
);

const SignupForm: React.FC<SignupFormProps> = ({ onRegistered }) => {
  const [registerForm, setRegisterForm] = useState({
    name: "",
    cpf: "",
    pixKey: "",
    secretCode: "",
    playerName: defaultPlayerName,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const requestJSON = async <T,>(url: string, body: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Não foi possível completar a operação.");
    }
    return payload as T;
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRegistering(true);
    setErrorMessage(null);
    try {
      await requestJSON<{ session: unknown }>(
        "/api/users/register",
        registerForm
      );
      const credentials = {
        cpf: registerForm.cpf,
        secretCode: registerForm.secretCode,
      };
      onRegistered(credentials);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao cadastrar.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Novo cadastro</h2>
      <p className="mt-1 text-sm text-slate-600">
        Cadastre o usuário, crie o primeiro jogador e libere o preenchimento da
        fase aberta.
      </p>
      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      <form onSubmit={handleRegister} className="mt-4 grid gap-3">
        <input
          className="rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Nome"
          minLength={3}
          maxLength={256}
          required
          value={registerForm.name}
          onChange={(event) =>
            setRegisterForm((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2"
          placeholder="CPF (apenas números)"
          inputMode="numeric"
          pattern="[0-9]{11}"
          minLength={11}
          maxLength={11}
          required
          value={registerForm.cpf}
          onChange={(event) =>
            setRegisterForm((current) => ({
              ...current,
              cpf: sanitizeCPF(event.target.value),
            }))
          }
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Chave do PIX (caso de vitorioso)"
          minLength={8}
          maxLength={256}
          required
          value={registerForm.pixKey}
          onChange={(event) =>
            setRegisterForm((current) => ({
              ...current,
              pixKey: event.target.value,
            }))
          }
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Senha"
          type="password"
          minLength={6}
          maxLength={256}
          required
          value={registerForm.secretCode}
          onChange={(event) =>
            setRegisterForm((current) => ({
              ...current,
              secretCode: event.target.value,
            }))
          }
        />
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isRegistering}
        >
          {isRegistering ? <Spinner /> : null}
          {isRegistering ? "Criando cadastro..." : "Criar cadastro"}
        </button>
      </form>
    </section>
  );
};

export default SignupForm;
