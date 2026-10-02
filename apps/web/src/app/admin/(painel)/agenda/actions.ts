'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  criarAgendamentoSchema,
  criarClienteSchema,
  remarcarAgendamentoSchema,
  type AlterarStatusAgendamentoInput,
  type ClienteResumo,
  type HorariosLivresProfissional,
} from '@salonflow/shared';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';

/** Resultado das ações chamadas pelos componentes da agenda. */
export type Resultado<T = undefined> = { ok: true; dados: T } | { ok: false; erro: string };

function falha(erro: unknown): { ok: false; erro: string } {
  if (erro instanceof ApiError) return { ok: false, erro: erro.message };
  return { ok: false, erro: 'Algo deu errado. Tente novamente.' };
}

function primeiroErro(erro: z.ZodError): { ok: false; erro: string } {
  return { ok: false, erro: erro.issues[0]?.message ?? 'Dados inválidos.' };
}

export async function buscarClientes(termo: string): Promise<Resultado<ClienteResumo[]>> {
  try {
    const dados = await apiSalao<ClienteResumo[]>(
      `/clientes?busca=${encodeURIComponent(termo.trim())}`,
    );
    return { ok: true, dados };
  } catch (erro) {
    return falha(erro);
  }
}

export async function criarCliente(entrada: {
  nome: string;
  telefone?: string;
}): Promise<Resultado<ClienteResumo>> {
  const validacao = criarClienteSchema.safeParse({
    nome: entrada.nome,
    telefone: entrada.telefone?.trim() || undefined,
  });
  if (!validacao.success) return primeiroErro(validacao.error);
  try {
    const dados = await apiSalao<ClienteResumo>('/clientes', {
      method: 'POST',
      body: validacao.data,
    });
    return { ok: true, dados };
  } catch (erro) {
    return falha(erro);
  }
}

export async function carregarHorarios(
  servicoId: string,
  data: string,
): Promise<Resultado<HorariosLivresProfissional[]>> {
  try {
    const dados = await apiSalao<HorariosLivresProfissional[]>(
      `/agenda/horarios-livres?servicoId=${servicoId}&data=${data}`,
    );
    return { ok: true, dados };
  } catch (erro) {
    return falha(erro);
  }
}

export async function criarAgendamento(entrada: unknown): Promise<Resultado> {
  const validacao = criarAgendamentoSchema.safeParse(entrada);
  if (!validacao.success) return primeiroErro(validacao.error);
  try {
    await apiSalao('/agendamentos', { method: 'POST', body: validacao.data });
  } catch (erro) {
    return falha(erro);
  }
  revalidatePath('/admin/agenda');
  return { ok: true, dados: undefined };
}

export async function alterarStatusAgendamento(
  id: string,
  status: AlterarStatusAgendamentoInput['status'],
): Promise<Resultado> {
  try {
    await apiSalao(`/agendamentos/${id}/status`, { method: 'PATCH', body: { status } });
  } catch (erro) {
    return falha(erro);
  }
  revalidatePath('/admin/agenda');
  return { ok: true, dados: undefined };
}

export async function remarcarAgendamento(id: string, entrada: unknown): Promise<Resultado> {
  const validacao = remarcarAgendamentoSchema.safeParse(entrada);
  if (!validacao.success) return primeiroErro(validacao.error);
  try {
    await apiSalao(`/agendamentos/${id}/remarcar`, { method: 'PATCH', body: validacao.data });
  } catch (erro) {
    return falha(erro);
  }
  revalidatePath('/admin/agenda');
  return { ok: true, dados: undefined };
}
