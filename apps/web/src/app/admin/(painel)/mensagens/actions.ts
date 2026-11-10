'use server';

import { revalidatePath } from 'next/cache';
import { configMensagensSchema, type ConfigMensagens } from '@salonflow/shared';
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
