'use server';

import { revalidatePath } from 'next/cache';
import { anotacaoClienteSchema, type AnotacaoCliente } from '@salonflow/shared';
import { apiPro } from '@/lib/api/pro';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';

/** Cria (anotacaoId null) ou edita um registro da ficha técnica (sempre em nome do profissional). */
export async function salvarAnotacaoPro(
  clienteId: string,
  anotacaoId: string | null,
  entrada: unknown,
): Promise<Resultado<AnotacaoCliente>> {
  const validacao = anotacaoClienteSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const caminho = `/pro/clientes/${clienteId}/anotacoes${anotacaoId ? `/${anotacaoId}` : ''}`;
    const dados = await apiPro<AnotacaoCliente>(caminho, {
      method: anotacaoId ? 'PUT' : 'POST',
      body: validacao.data,
    });
    revalidatePath(`/pro/clientes/${clienteId}`);
    return sucesso(dados);
  } catch (erro) {
    return falha(erro);
  }
}

export async function excluirAnotacaoPro(
  clienteId: string,
  anotacaoId: string,
): Promise<Resultado> {
  try {
    await apiPro(`/pro/clientes/${clienteId}/anotacoes/${anotacaoId}`, { method: 'DELETE' });
    revalidatePath(`/pro/clientes/${clienteId}`);
    return sucesso(undefined);
  } catch (erro) {
    return falha(erro);
  }
}
