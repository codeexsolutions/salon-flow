'use server';

import { revalidatePath } from 'next/cache';
import {
  configuracaoComissaoSchema,
  definirRegrasComissaoSchema,
  gerarRepasseSchema,
  type RepasseDetalhe,
} from '@salonflow/shared';
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

export async function gerarRepasse(entrada: unknown): Promise<Resultado<string>> {
  const validacao = gerarRepasseSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const repasse = await apiSalao<RepasseDetalhe>('/comissoes/repasses', {
      method: 'POST',
      body: validacao.data,
    });
    revalidatePath('/admin/comissoes', 'layout');
    return sucesso(repasse.id);
  } catch (erro) {
    return falha(erro);
  }
}

export async function cancelarRepasse(id: string) {
  await apiSalao(`/comissoes/repasses/${id}/cancelar`, { method: 'POST' });
  revalidatePath('/admin/comissoes', 'layout');
}
