import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadLocalEnv();

const cliOptions = parseCliArgs(process.argv.slice(2));

async function main() {
  requireEnv("SUPABASE_URL");
  requireEnv("SUPABASE_ANON_KEY");
  requireEnv("FOOTBAL_DATA_ORG_API_KEY");

  // Importado dinamicamente após o carregamento do env: lib/supabaseClient lê as
  // credenciais no momento do import.
  const { seedMatchesForStage } = await import("../lib/syncMatches");

  const summary = await seedMatchesForStage(cliOptions.phase ?? undefined);

  console.info(
    [
      cliOptions.phase ? `stage ${cliOptions.phase}` : "all stages",
      `fase ${summary.fase ?? "-"}`,
      `inserted ${summary.inserted}`,
      `updated ${summary.updated}`,
      `skipped ${summary.skipped}`,
    ].join(" | "),
  );
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
  let phase: string | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--phase") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("Missing value for --phase");
      }
      phase = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--phase=")) {
      phase = arg.slice("--phase=".length) || null;
      if (!phase) {
        throw new Error("Missing value for --phase");
      }
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { phase };
}

main().catch((error) => {
  console.error("seedMatches failed", error);
  process.exitCode = 1;
});
