'use server';

import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api/client';
import { obterSessao } from '@/lib/auth/sessao';

/** Quantas notificações há no sino (0 se não logado ou API antiga). */
export async function contarNotificacoes(): Promise<number> {
  const sessao = await obterSessao();
  if (!sessao) return 0;
  try {
    const r = await api<{ total: number }>('/me/notificacoes/contagem', {
      token: sessao.token,
      cache: 'no-store',
    });
    return r.total;
  } catch {
    return 0;
  }
}

export async function limparNotificacoes() {
  const sessao = await obterSessao();
  if (!sessao) return;
  await api('/me/notificacoes', { method: 'DELETE', token: sessao.token }).catch(() => null);
  revalidatePath('/notificacoes');
}
