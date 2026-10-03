'use server';

import {
  definirRecuperacaoSchema,
  recuperarSenhaSchema,
  type CodigoRecuperacao,
} from '@salonflow/shared';
import { api } from '@/lib/api/client';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { obterSessao } from './sessao';

/** Conta logada: salva o celular e gera um novo código de recuperação. */
export async function definirRecuperacao(
  telefone: string,
): Promise<Resultado<CodigoRecuperacao>> {
  const validacao = definirRecuperacaoSchema.safeParse({ telefone });
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  const sessao = await obterSessao();
  if (!sessao) return { ok: false, erro: 'Entre na sua conta para continuar.' };
  try {
    return sucesso(
      await api<CodigoRecuperacao>('/me/recuperacao', {
        method: 'POST',
        token: sessao.token,
        body: validacao.data,
      }),
    );
  } catch (erro) {
    return falha(erro);
  }
}

/** "Esqueci minha senha": usuário + celular + código definem uma senha nova. */
export async function recuperarSenha(entrada: unknown): Promise<Resultado<CodigoRecuperacao>> {
  const validacao = recuperarSenhaSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    return sucesso(
      await api<CodigoRecuperacao>('/recuperacao-senha', { method: 'POST', body: validacao.data }),
    );
  } catch (erro) {
    return falha(erro);
  }
}
