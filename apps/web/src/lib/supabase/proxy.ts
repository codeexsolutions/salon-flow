import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '../env';

/** Áreas que exigem login. A checagem de PAPEL é feita nas páginas (lib/auth). */
const ROTAS_PROTEGIDAS = ['/admin', '/pro', '/meus-agendamentos'];

/**
 * Roda a cada requisição (via src/proxy.ts):
 * 1. renova o token do Supabase quando está para expirar e grava os cookies novos;
 * 2. manda para /entrar quem tenta abrir uma área protegida sem login.
 */
export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar, headers) {
        cookiesParaGravar.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        cookiesParaGravar.forEach(({ name, value, options }) =>
          resposta.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([chave, valor]) => resposta.headers.set(chave, valor));
      },
    },
  });

  // Não colocar código entre a criação do cliente e esta chamada: é ela que renova a sessão.
  const { data } = await supabase.auth.getClaims();

  const caminho = request.nextUrl.pathname;
  const protegida = ROTAS_PROTEGIDAS.some((r) => caminho === r || caminho.startsWith(`${r}/`));

  if (protegida && !data?.claims) {
    const url = request.nextUrl.clone();
    url.pathname = '/entrar';
    url.search = '';
    url.searchParams.set('next', caminho + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return resposta;
}
