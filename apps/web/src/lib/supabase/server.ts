import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '../env';

/** Cliente Supabase para Server Components / Route Handlers (lê a sessão dos cookies). */
export async function criarSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          cookiesParaGravar.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado de um Server Component: não dá para gravar cookies aqui.
          // A renovação da sessão será feita no proxy.ts (etapa de autenticação).
        }
      },
    },
  });
}
