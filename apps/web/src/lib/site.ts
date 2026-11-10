import 'server-only';
import { headers } from 'next/headers';

/** Endereço público do site (para links enviados por WhatsApp). */
export async function origemDoSite(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const protocolo =
    h.get('x-forwarded-proto') ?? (/^(localhost|127\.|192\.168\.)/.test(host) ? 'http' : 'https');
  return `${protocolo}://${host}`;
}
