import 'server-only';
import { api } from '@/lib/api/client';

/** Chave pública VAPID da API (null = push desligado ou API antiga). */
export async function chavePublicaPush(): Promise<string | null> {
  try {
    const r = await api<{ chave: string | null }>('/push/chave-publica', {
      cache: 'no-store',
    });
    return r.chave;
  } catch {
    return null;
  }
}
