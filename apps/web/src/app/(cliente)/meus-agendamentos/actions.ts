'use server';

import { revalidatePath } from 'next/cache';
import { api, ApiError } from '@/lib/api/client';
import { exigirSessao } from '@/lib/auth/sessao';

export async function cancelarMeuAgendamento(id: string): Promise<{ erro?: string }> {
  const sessao = await exigirSessao('/meus-agendamentos');
  try {
    await api(`/me/agendamentos/${id}/cancelar`, { method: 'PATCH', token: sessao.token });
  } catch (erro) {
    return { erro: erro instanceof ApiError ? erro.message : 'Não foi possível cancelar.' };
  }
  revalidatePath('/meus-agendamentos');
  return {};
}
