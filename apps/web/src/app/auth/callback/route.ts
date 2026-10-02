import type { EmailOtpType } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { caminhoSeguro } from '@/lib/auth/destino';
import { redirecionar } from '@/lib/http/redirecionar';
import { criarSupabaseServer } from '@/lib/supabase/server';

/**
 * Retorno dos links do Supabase (recuperar senha, confirmar e-mail) e do Google.
 * Troca o código recebido por uma sessão (cookies) e segue para /auth/continuar.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const tipo = searchParams.get('type') as EmailOtpType | null;
  const next = caminhoSeguro(searchParams.get('next'));

  const supabase = await criarSupabaseServer();
  let erro: unknown = null;

  if (code) {
    ({ error: erro } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && tipo) {
    ({ error: erro } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo }));
  } else {
    erro = new Error('Callback sem código');
  }

  if (erro) return redirecionar('/entrar?erro=link');
  return redirecionar(
    next ? `/auth/continuar?next=${encodeURIComponent(next)}` : '/auth/continuar',
  );
}
