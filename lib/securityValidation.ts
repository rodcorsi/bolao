import { PhaseState } from "./tournamentPhase";
import { isFullName } from "./formatName";
import { normalizeCPF } from "./users";

export function assertInitialPhase(phaseState: PhaseState) {
  if (phaseState.currentPhase !== "INICIO") {
    throw new Error("Cadastros e novos jogadores só são permitidos na fase inicial.");
  }
}

export function assertValidSignupInput(input: {
  name: unknown;
  cpf: unknown;
  pixKey: unknown;
  secretCode: unknown;
  playerName: unknown;
}) {
  const name = assertStringLength(input.name, "Nome", 3, 256).trim();
  if (!isFullName(name)) {
    throw new Error("Informe nome e sobrenome.");
  }
  const cpf = normalizeCPF(assertStringLength(input.cpf, "CPF", 11, 32));
  if (cpf.length !== 11) {
    throw new Error("CPF deve conter 11 números.");
  }
  const pixKey = assertStringLength(input.pixKey, "Chave PIX", 8, 256).trim();
  const secretCode = assertStringLength(input.secretCode, "Senha", 6, 256);
  const playerName = assertStringLength(
    input.playerName,
    "Nome do jogador",
    3,
    256
  ).trim();
  return {
    name,
    cpf,
    pixKey,
    secretCode,
    playerName,
  };
}

export function assertValidPlayerName(value: unknown) {
  return assertStringLength(value, "Nome do jogador", 3, 256).trim();
}

export function assertValidUserName(value: unknown) {
  return assertStringLength(value, "Nome", 3, 256).trim();
}

function assertStringLength(
  value: unknown,
  label: string,
  minLength: number,
  maxLength: number
) {
  if (typeof value !== "string") {
    throw new Error(`${label} inválido.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    throw new Error(
      `${label} deve ter entre ${minLength} e ${maxLength} caracteres.`
    );
  }
  return value;
}
