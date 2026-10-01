import { createBrowserClient } from '@supabase/ssr';
import { env } from '../env';

/** Cliente Supabase para Client Components (login, sessão). Dados de negócio vêm da API. */
export function criarSupabaseBrowser() {
  return createBrowserClient(env.supabaseUrl, env.supabasePublishableKey);
}
