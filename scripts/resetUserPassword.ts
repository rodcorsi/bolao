import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

import { hashSecret } from "../lib/secret";

loadLocalEnv();

async function main() {
  const { cpf, password } = parseCliArgs(process.argv.slice(2));
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || requireEnv("SUPABASE_ANON_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("users")
    .update({ secret_hash: hashSecret(password) })
    .eq("cpf", cpf)
    .select("id, name, cpf")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error(`Nenhum usuário encontrado para o CPF ${cpf}.`);
  }

  console.info(`Senha resetada para ${data.name} (${data.cpf}).`);
}

function loadLocalEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) {
      loadEnv({ path, override: false });
    }
  }
}

function requireEnv(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseCliArgs(args: string[]) {
  const [rawCPF, password] = args;
  if (!rawCPF || !password || args.length !== 2) {
    throw new Error("Uso: bun scripts/resetUserPassword.ts <cpf> <nova-senha>");
  }

  const cpf = rawCPF.replace(/\D/g, "");
  if (cpf.length !== 11) {
    throw new Error("CPF inválido. Informe 11 dígitos.");
  }

  return { cpf, password };
}

main().catch((error) => {
  console.error("resetUserPassword failed", error);
  process.exitCode = 1;
});
