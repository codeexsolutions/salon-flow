import { NextResponse, type NextRequest } from 'next/server';
import { caminhoSeguro, destinoPorPapel } from '@/lib/auth/destino';
import { obterPerfil } from '@/lib/auth/sessao';
import { criarSupabaseServer } from '@/lib/supabase/server';

/**
 * Logo após o login: registra o usuário na API (GET /me faz o cadastro no
 * primeiro acesso) e manda para o `next` pedido ou para a área do papel dele.
 */
export async function GET(request: NextRequest) {
  const next = caminhoSeguro(request.nextUrl.searchParams.get('next'));
  const perfil = await obterPerfil(next ?? '/');

  // Perfil escolhido ao criar a conta ("Tenho um salão", "Sou profissional"...).
  const { data } = await (await criarSupabaseServer()).auth.getClaims();
  const metadados = data?.claims.user_metadata as { tipo_conta?: string } | undefined;

  const destino = next ?? destinoPorPapel(perfil, metadados?.tipo_conta);
  return NextResponse.redirect(new URL(destino, request.nextUrl.origin));
}
