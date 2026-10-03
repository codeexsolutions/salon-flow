import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { usuarioDeLogin, type PerfilUsuario } from '@salonflow/shared';
import { api } from '../api/client';
import { criarSupabaseServer } from '../supabase/server';

export interface Sessao {
  /** Access token do Supabase, enviado à API no header Authorization. */
  token: string;
  usuarioId: string;
  email: string;
  /** Usuário de login (o e-mail é interno). */
  usuario: string;
}

/**
 * Camada de acesso aos dados de sessão (DAL). Toda página/ação que precisa do
 * usuário passa por aqui. `cache` evita repetir o trabalho na mesma requisição.
 */
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await criarSupabaseServer();

  // getClaims valida a assinatura do token (JWKS); getSession só lê o cookie.
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  return {
    token: session.access_token,
    usuarioId: data.claims.sub,
    email: (data.claims.email as string | undefined) ?? '',
    usuario: usuarioDeLogin((data.claims.email as string | undefined) ?? ''),
  };
});

/** Exige login: sem sessão, manda para /entrar e volta para `destino` depois. */
export async function exigirSessao(destino: string): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect(`/entrar?next=${encodeURIComponent(destino)}`);
  return sessao;
}

/** Perfil do usuário logado na API (cadastro + salões em que atua). */
export const obterPerfil = cache(async (destino: string): Promise<PerfilUsuario> => {
  const sessao = await exigirSessao(destino);
  return api<PerfilUsuario>('/me', { token: sessao.token, cache: 'no-store' });
});
