'use server';

import { revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { abrirCaixaSchema, fecharCaixaSchema, movimentoCaixaSchema } from '@salonflow/shared';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { apiSalao } from '@/lib/api/salao';

async function enviar(caminho: string, schema: z.ZodType, entrada: unknown): Promise<Resultado> {
  const validacao = schema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao(caminho, { method: 'POST', body: validacao.data });
  } catch (erro) {
    return falha(erro);
  }
  revalidatePath('/admin/caixa', 'layout');
  return sucesso(undefined);
}

export async function abrirCaixa(entrada: unknown) {
  return enviar('/caixa/abrir', abrirCaixaSchema, entrada);
}

export async function movimentarCaixa(entrada: unknown) {
  return enviar('/caixa/movimentos', movimentoCaixaSchema, entrada);
}

export async function fecharCaixa(entrada: unknown) {
  return enviar('/caixa/fechar', fecharCaixaSchema, entrada);
}
