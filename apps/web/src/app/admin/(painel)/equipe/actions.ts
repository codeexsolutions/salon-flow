'use server';

import { revalidatePath } from 'next/cache';
import {
  convidarRecepcaoSchema,
  redefinirSenhaSchema,
  type ResultadoConvite,
} from '@salonflow/shared';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { apiSalao } from '@/lib/api/salao';

/** Libera o painel para a recepção (só o dono — a API confere). */
export async function convidarRecepcao(entrada: unknown): Promise<Resultado<ResultadoConvite>> {
  const validacao = convidarRecepcaoSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const resultado = await apiSalao<ResultadoConvite>('/equipe/convites', {
      method: 'POST',
      body: validacao.data,
    });
    revalidatePath('/admin/equipe');
    return sucesso(resultado);
  } catch (erro) {
    return falha(erro);
  }
}

export async function cancelarConvite(id: string): Promise<Resultado> {
  try {
    await apiSalao(`/equipe/convites/${id}`, { method: 'DELETE' });
    revalidatePath('/admin/equipe');
    return sucesso(undefined);
  } catch (erro) {
    return falha(erro);
  }
}

/** Senha provisória nova para alguém da equipe que esqueceu a dele. */
export async function redefinirSenhaMembro(id: string, senha: string): Promise<Resultado> {
  const validacao = redefinirSenhaSchema.safeParse({ senha });
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao(`/equipe/membros/${id}/senha`, { method: 'POST', body: validacao.data });
    return sucesso(undefined);
  } catch (erro) {
    return falha(erro);
  }
}

/** Remove (ativo=false) ou devolve o acesso de alguém da equipe. */
export async function alterarAcesso(id: string, ativo: boolean): Promise<Resultado> {
  try {
    await apiSalao(`/equipe/membros/${id}`, { method: 'PATCH', body: { ativo } });
    revalidatePath('/admin/equipe');
    return sucesso(undefined);
  } catch (erro) {
    return falha(erro);
  }
}
