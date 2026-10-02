'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  adicionarItemComandaSchema,
  atualizarComandaSchema,
  fecharComandaSchema,
  type ComandaDetalhe,
} from '@salonflow/shared';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { apiSalao } from '@/lib/api/salao';

const atualizar = (id: string) => {
  revalidatePath(`/admin/comandas/${id}`);
  revalidatePath('/admin/comandas');
};

/** Abre uma comanda vazia e vai para ela. */
export async function novaComanda() {
  const comanda = await apiSalao<ComandaDetalhe>('/comandas', { method: 'POST', body: {} });
  redirect(`/admin/comandas/${comanda.id}`);
}

/** Abre a comanda já com o serviço do agendamento (botão na agenda). */
export async function abrirComandaDoAgendamento(agendamentoId: string): Promise<Resultado<string>> {
  try {
    const comanda = await apiSalao<ComandaDetalhe>('/comandas', {
      method: 'POST',
      body: { agendamentoIds: [agendamentoId] },
    });
    revalidatePath('/admin/comandas');
    return sucesso(comanda.id);
  } catch (erro) {
    return falha(erro);
  }
}

export async function adicionarItem(id: string, entrada: unknown): Promise<Resultado> {
  const validacao = adicionarItemComandaSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao(`/comandas/${id}/itens`, { method: 'POST', body: validacao.data });
  } catch (erro) {
    return falha(erro);
  }
  atualizar(id);
  return sucesso(undefined);
}

export async function removerItem(id: string, itemId: string): Promise<Resultado> {
  try {
    await apiSalao(`/comandas/${id}/itens/${itemId}`, { method: 'DELETE' });
  } catch (erro) {
    return falha(erro);
  }
  atualizar(id);
  return sucesso(undefined);
}

export async function salvarComanda(id: string, entrada: unknown): Promise<Resultado> {
  const validacao = atualizarComandaSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao(`/comandas/${id}`, { method: 'PATCH', body: validacao.data });
  } catch (erro) {
    return falha(erro);
  }
  atualizar(id);
  return sucesso(undefined);
}

export async function fecharComanda(id: string, entrada: unknown): Promise<Resultado> {
  const validacao = fecharComandaSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao(`/comandas/${id}/fechar`, { method: 'POST', body: validacao.data });
  } catch (erro) {
    return falha(erro);
  }
  atualizar(id);
  revalidatePath('/admin/agenda');
  return sucesso(undefined);
}

export async function cancelarComanda(id: string): Promise<Resultado> {
  try {
    await apiSalao(`/comandas/${id}/cancelar`, { method: 'POST' });
  } catch (erro) {
    return falha(erro);
  }
  atualizar(id);
  return sucesso(undefined);
}
