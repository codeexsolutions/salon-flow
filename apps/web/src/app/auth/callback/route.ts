import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { caminhoSeguro } from '@/lib/auth/destino';
import { criarSupabaseServer } from '@/lib/supabase/server';

/**
 * Retorno do link mágico (e-mail) e do login com Google.
 * Troca o código recebido por uma sessão (cookies) e segue para /auth/continuar.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
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

  if (erro) {
    return NextResponse.redirect(new URL('/entrar?erro=link', origin));
  }

  const continuar = new URL('/auth/continuar', origin);
  if (next) continuar.searchParams.set('next', next);
  return NextResponse.redirect(continuar);
}
