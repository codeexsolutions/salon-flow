import { NextResponse } from 'next/server';

/**
 * Redireciona para um caminho RELATIVO (ex.: "/pro"). O navegador resolve no mesmo
 * endereço que está usando — localhost, IP da rede (celular) ou domínio de produção.
 * Evita `new URL(caminho, request.nextUrl.origin)`, que em desenvolvimento pode
 * apontar para "localhost" mesmo quando o acesso veio pelo IP.
 */
export function redirecionar(caminho: string): NextResponse {
  return new NextResponse(null, { status: 307, headers: { Location: caminho } });
}
