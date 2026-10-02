'use server';

import { revalidatePath } from 'next/cache';
import { configuracaoComissaoSchema, definirRegrasComissaoSchema } from '@salonflow/shared';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { apiSalao } from '@/lib/api/salao';

export async function salvarConfiguracaoComissao(entrada: unknown): Promise<Resultado> {
  const validacao = configuracaoComissaoSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao('/comissoes/configuracao', { method: 'PUT', body: validacao.data });
  } catch (erro) {
    return falha(erro);
  }
  revalidatePath('/admin/comissoes');
  return sucesso(undefined);
}

export async function salvarRegrasComissao(entrada: unknown): Promise<Resultado> {
  const validacao = definirRegrasComissaoSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao('/comissoes/regras', { method: 'PUT', body: validacao.data });
  } catch (erro) {
    return falha(erro);
  }
  revalidatePath('/admin/comissoes');
  return sucesso(undefined);
}
