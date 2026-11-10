'use server';

import { revalidatePath } from 'next/cache';
import { perfilClienteSchema, type PerfilCliente } from '@salonflow/shared';
import { api } from '@/lib/api/client';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { exigirSessao } from '@/lib/auth/sessao';

export async function salvarMeusDados(entrada: unknown): Promise<Resultado<PerfilCliente>> {
  const validacao = perfilClienteSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const sessao = await exigirSessao('/conta/dados');
    const dados = await api<PerfilCliente>('/me/perfil-cliente', {
      method: 'PUT',
      body: validacao.data,
      token: sessao.token,
    });
    revalidatePath('/conta/dados');
    revalidatePath('/meus-agendamentos');
    return sucesso(dados);
  } catch (erro) {
    return falha(erro);
  }
}
