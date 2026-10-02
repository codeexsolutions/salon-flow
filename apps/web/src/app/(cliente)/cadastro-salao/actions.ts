'use server';

import type { SalaoPublico } from '@salonflow/shared';
import { api, ApiError } from '@/lib/api/client';

/** O endereço (/s/slug) ainda está livre? Usado antes de criar a conta do salão. */
export async function enderecoDisponivel(slug: string): Promise<boolean> {
  try {
    await api<SalaoPublico>(`/saloes/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    return false;
  } catch (erro) {
    if (erro instanceof ApiError && erro.erro.statusCode === 404) return true;
    throw erro;
  }
}
