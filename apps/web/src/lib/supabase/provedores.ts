import 'server-only';
import { env } from '../env';

interface ConfiguracaoAuth {
  external?: Record<string, boolean>;
}

/**
 * Provedores de login ativos no Supabase (ex.: Google). Consulta /auth/v1/settings,
 * para a tela de login só oferecer o que está habilitado no painel do Supabase.
 */
export async function provedoresAtivos(): Promise<{ google: boolean }> {
  try {
    const resposta = await fetch(`${env.supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: env.supabasePublishableKey },
      next: { revalidate: 300 },
    });
    if (!resposta.ok) return { google: false };
    const config = (await resposta.json()) as ConfiguracaoAuth;
    return { google: config.external?.google === true };
  } catch {
    return { google: false };
  }
}
