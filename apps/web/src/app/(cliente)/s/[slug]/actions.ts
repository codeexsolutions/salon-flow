'use server';

import { revalidatePath } from 'next/cache';
import {
  agendarPeloAppSchema,
  type AgendarPeloAppInput,
  type HorariosLivresProfissional,
} from '@salonflow/shared';
import { api, ApiError } from '@/lib/api/client';
import { obterSessao } from '@/lib/auth/sessao';

export type ResultadoPublico<T = undefined> =
  { ok: true; dados: T } | { ok: false; erro: string; precisaLogin?: boolean };

const caminho = (slug: string) => `/publico/saloes/${encodeURIComponent(slug)}`;

/** Horários livres para o cliente (não exige login). */
export async function horariosPublicos(
  slug: string,
  servicoId: string,
  data: string,
): Promise<ResultadoPublico<HorariosLivresProfissional[]>> {
  try {
    const dados = await api<HorariosLivresProfissional[]>(
      `${caminho(slug)}/horarios-livres?servicoId=${servicoId}&data=${data}`,
      { cache: 'no-store' },
    );
    return { ok: true, dados };
  } catch (erro) {
    return {
      ok: false,
      erro: erro instanceof ApiError ? erro.message : 'Não foi possível carregar os horários.',
    };
  }
}

/** Confirma o agendamento (exige login: o cliente vira cliente do salão). */
export async function agendarNoSalao(
  slug: string,
  entrada: AgendarPeloAppInput,
): Promise<ResultadoPublico> {
  const sessao = await obterSessao();
  if (!sessao) return { ok: false, erro: 'Entre para confirmar.', precisaLogin: true };

  const validacao = agendarPeloAppSchema.safeParse(entrada);
  if (!validacao.success) return { ok: false, erro: 'Escolha serviço, profissional e horário.' };

  try {
    await api(`${caminho(slug)}/agendamentos`, {
      method: 'POST',
      token: sessao.token,
      body: validacao.data,
    });
  } catch (erro) {
    return {
      ok: false,
      erro: erro instanceof ApiError ? erro.message : 'Não foi possível agendar. Tente novamente.',
    };
  }
  revalidatePath('/meus-agendamentos');
  return { ok: true, dados: undefined };
}
