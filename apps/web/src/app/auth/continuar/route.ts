import { NextResponse, type NextRequest } from 'next/server';
import { caminhoSeguro, destinoPorPapel } from '@/lib/auth/destino';
import { obterPerfil } from '@/lib/auth/sessao';

/**
 * Logo após o login: registra o usuário na API (GET /me faz o cadastro no
 * primeiro acesso) e manda para o `next` pedido ou para a área do papel dele.
 */
export async function GET(request: NextRequest) {
  const next = caminhoSeguro(request.nextUrl.searchParams.get('next'));
  const perfil = await obterPerfil(next ?? '/');
  return NextResponse.redirect(new URL(next ?? destinoPorPapel(perfil), request.nextUrl.origin));
}
