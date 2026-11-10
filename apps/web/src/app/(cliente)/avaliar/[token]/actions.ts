'use server';

import { responderAvaliacaoSchema, type AvaliacaoPublica } from '@salonflow/shared';
import { api } from '@/lib/api/client';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';

/** Resposta do cliente (sem login: o token do link autoriza). */
export async function enviarAvaliacao(
  token: string,
  entrada: unknown,
): Promise<Resultado<AvaliacaoPublica>> {
  const validacao = responderAvaliacaoSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const dados = await api<AvaliacaoPublica>(`/avaliacao-publica/${token}`, {
      method: 'POST',
      body: validacao.data,
    });
    return sucesso(dados);
  } catch (erro) {
    return falha(erro);
  }
}
