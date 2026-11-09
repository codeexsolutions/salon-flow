'use server';

import { revalidatePath } from 'next/cache';
import { contratoSchema, encerrarContratoSchema, type ContratoDetalhe } from '@salonflow/shared';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { apiSalao } from '@/lib/api/salao';

function revalidar(id?: string) {
  revalidatePath('/admin/contratos');
  if (id) revalidatePath(`/admin/contratos/${id}`);
}

/** Cria (id null) ou atualiza o contrato. Devolve o id. */
export async function salvarContrato(
  id: string | null,
  entrada: unknown,
): Promise<Resultado<string>> {
  const validacao = contratoSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const contrato = await apiSalao<ContratoDetalhe>(id ? `/contratos/${id}` : '/contratos', {
      method: id ? 'PUT' : 'POST',
      body: validacao.data,
    });
    revalidar(contrato.id);
    return sucesso(contrato.id);
  } catch (erro) {
    return falha(erro);
  }
}

export async function ativarContrato(id: string): Promise<Resultado> {
  try {
    await apiSalao(`/contratos/${id}/ativar`, { method: 'POST' });
    revalidar(id);
    return sucesso(undefined);
  } catch (erro) {
    return falha(erro);
  }
}

export async function encerrarContrato(id: string, entrada: unknown): Promise<Resultado> {
  const validacao = encerrarContratoSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao(`/contratos/${id}/encerrar`, { method: 'POST', body: validacao.data });
    revalidar(id);
    return sucesso(undefined);
  } catch (erro) {
    return falha(erro);
  }
}

export async function excluirContrato(id: string): Promise<Resultado> {
  try {
    await apiSalao(`/contratos/${id}`, { method: 'DELETE' });
    revalidar();
    return sucesso(undefined);
  } catch (erro) {
    return falha(erro);
  }
}
