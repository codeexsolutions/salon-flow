'use server';

import { revalidatePath } from 'next/cache';
import {
  configMensagensSchema,
  enviarPushSchema,
  type ConfigMensagens,
  type ResultadoEnvioPush,
} from '@salonflow/shared';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { apiSalao } from '@/lib/api/salao';

export async function salvarConfigMensagens(entrada: unknown): Promise<Resultado<ConfigMensagens>> {
  const validacao = configMensagensSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const dados = await apiSalao<ConfigMensagens>('/mensagens/config', {
      method: 'PUT',
      body: validacao.data,
    });
    revalidatePath('/admin/mensagens');
    return sucesso(dados);
  } catch (erro) {
    return falha(erro);
  }
}

export async function enviarPushManual(entrada: unknown): Promise<Resultado<ResultadoEnvioPush>> {
  const validacao = enviarPushSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const dados = await apiSalao<ResultadoEnvioPush>('/mensagens/push', {
      method: 'POST',
      body: validacao.data,
    });
    return sucesso(dados);
  } catch (erro) {
    return falha(erro);
  }
}
