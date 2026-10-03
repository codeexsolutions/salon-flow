import 'server-only';
import { cookies } from 'next/headers';
import type { VinculoSalao } from '@salonflow/shared';

export const COOKIE_SALAO_ATIVO = 'salao_ativo';

/**
 * Escolhe o salão em que o usuário está operando: o do cookie, se ainda for válido
 * para a área pedida; senão, o primeiro salão que vale para ela.
 */
export async function resolverSalaoAtivo(
  saloes: VinculoSalao[],
  valePara: (salao: VinculoSalao) => boolean,
): Promise<VinculoSalao | null> {
  const permitidos = saloes.filter(valePara);
  const escolhido = (await cookies()).get(COOKIE_SALAO_ATIVO)?.value;
  return permitidos.find((s) => s.id === escolhido) ?? permitidos[0] ?? null;
}

export async function gravarSalaoAtivo(salaoId: string) {
  (await cookies()).set(COOKIE_SALAO_ATIVO, salaoId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
