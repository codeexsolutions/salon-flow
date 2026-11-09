import 'server-only';
import type { ContratoDetalhe } from '@salonflow/shared';
import { obterContextoPro } from '../auth/contexto';
import { exigirSessao } from '../auth/sessao';
import { api } from './client';

/** Contrato do profissional logado (null = sem salão ou sem contrato; API antiga também). */
export async function meuContrato(): Promise<ContratoDetalhe | null> {
  const { salao } = await obterContextoPro();
  if (!salao) return null;
  const sessao = await exigirSessao('/pro/contrato');
  try {
    const r = await api<{ contrato: ContratoDetalhe | null }>('/pro/contrato', {
      token: sessao.token,
      salaoId: salao.id,
      cache: 'no-store',
    });
    return r.contrato;
  } catch {
    return null;
  }
}
