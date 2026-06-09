import { ptBR } from "./pt-BR";
export function t(key: string): string {
  return ptBR[key] ?? key;
}
