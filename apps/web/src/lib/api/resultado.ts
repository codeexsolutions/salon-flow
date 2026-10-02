import type { z } from 'zod';
import { ApiError } from './client';

/** Retorno padrão das Server Actions chamadas por componentes (sem formulário). */
export type Resultado<T = undefined> = { ok: true; dados: T } | { ok: false; erro: string };

export function sucesso<T>(dados: T): Resultado<T> {
  return { ok: true, dados };
}

export function falha(erro: unknown): { ok: false; erro: string } {
  if (erro instanceof ApiError) return { ok: false, erro: erro.message };
  return { ok: false, erro: 'Algo deu errado. Tente novamente.' };
}

export function falhaDeValidacao(erro: z.ZodError): { ok: false; erro: string } {
  return { ok: false, erro: erro.issues[0]?.message ?? 'Dados inválidos.' };
}
