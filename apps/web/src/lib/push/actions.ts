'use server';

import { assinaturaPushSchema } from '@salonflow/shared';
import { api } from '@/lib/api/client';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { exigirSessao } from '@/lib/auth/sessao';

/** Guarda a inscrição de push deste aparelho na conta do usuário. */
export async function inscreverPush(assinatura: unknown): Promise<Resultado> {
  const validacao = assinaturaPushSchema.safeParse(assinatura);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const sessao = await exigirSessao('/meus-agendamentos');
    await api('/me/push', { method: 'POST', body: validacao.data, token: sessao.token });
    return sucesso(undefined);
  } catch (erro) {
    return falha(erro);
  }
}

export async function cancelarPush(endpoint: string): Promise<Resultado> {
  try {
    const sessao = await exigirSessao('/meus-agendamentos');
    await api('/me/push/cancelar', { method: 'POST', body: { endpoint }, token: sessao.token });
    return sucesso(undefined);
  } catch (erro) {
    return falha(erro);
  }
}
