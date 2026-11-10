import { NextResponse, type NextRequest } from 'next/server';
import { api } from '@/lib/api/client';
import { obterSessao } from '@/lib/auth/sessao';

/**
 * Abre uma notificação (do sino ou do push): apaga da caixa e segue para a
 * página dela. Já aberta/apagada: vai para a lista de notificações.
 */
export async function GET(
  requisicao: NextRequest,
  { params }: RouteContext<'/notificacoes/abrir/[id]'>,
) {
  const { id } = await params;
  const aqui = `/notificacoes/abrir/${id}`;
  const sessao = await obterSessao();
  if (!sessao) {
    return NextResponse.redirect(
      new URL(`/entrar?next=${encodeURIComponent(aqui)}`, requisicao.url),
    );
  }
  let destino = '/notificacoes';
  try {
    const r = await api<{ url: string }>(`/me/notificacoes/${id}/abrir`, {
      method: 'POST',
      token: sessao.token,
    });
    destino = r.url;
  } catch {
    // Já aberta ou apagada.
  }
  return NextResponse.redirect(new URL(destino, requisicao.url));
}
