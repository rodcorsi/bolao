import { supabase } from "./supabaseClient";
import { hashSecret, verifySecret } from "./secret";

export interface User {
  id: number;
  name: string;
  cpf: string;
  pixKey: string;
}

export interface UserRecord extends User {
  secretHash: string;
}

export function normalizeCPF(cpf: string) {
  return cpf.replace(/\D/g, "");
}

function mapUser(row: any): UserRecord {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf,
    pixKey: row.pix_key,
    secretHash: row.secret_hash,
  };
}

export async function getUserByCPF(cpf: string) {
  const normalizedCPF = normalizeCPF(cpf);
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("cpf", normalizedCPF)
    .maybeSingle();
  if (error) {
    console.error(`Error fetching user by CPF ${normalizedCPF}:`, error.message);
    return null;
  }
  return data ? mapUser(data) : null;
}

export async function createUser(input: {
  name: string;
  cpf: string;
  pixKey: string;
  secretCode: string;
}) {
  const normalizedCPF = normalizeCPF(input.cpf);
  const { data, error } = await supabase
    .from("users")
    .insert({
      name: input.name.trim(),
      cpf: normalizedCPF,
      pix_key: input.pixKey.trim(),
      secret_hash: hashSecret(input.secretCode),
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return mapUser(data);
}

export function assertUserSecret(user: UserRecord, secretCode: string) {
  if (!verifySecret(secretCode, user.secretHash)) {
    throw new Error("Código secreto inválido.");
  }
}
