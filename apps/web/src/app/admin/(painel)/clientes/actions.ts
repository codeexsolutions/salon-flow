'use server';

import { revalidatePath } from 'next/cache';
import {
  anotacaoClienteSchema,
  atualizarClienteSchema,
  criarClienteSchema,
  type AnotacaoCliente,
  type ClienteResumo,
} from '@salonflow/shared';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { apiSalao } from '@/lib/api/salao';

function revalidar(id: string) {
  revalidatePath('/admin/clientes');
  revalidatePath(`/admin/clientes/${id}`);
}

/** Cadastro pelo painel (campos vazios são ignorados). */
export async function cadastrarCliente(entrada: {
  nome: string;
  telefone: string;
  email: string;
  nascimento: string;
  observacoes: string;
  recebeNotificacoes: boolean;
}): Promise<Resultado<ClienteResumo>> {
  const validacao = criarClienteSchema.safeParse({
    nome: entrada.nome,
    telefone: entrada.telefone.trim() || undefined,
    email: entrada.email.trim() || undefined,
    nascimento: entrada.nascimento || undefined,
    observacoes: entrada.observacoes.trim() || undefined,
    recebeNotificacoes: entrada.recebeNotificacoes,
  });
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const cliente = await apiSalao<ClienteResumo>('/clientes', {
      method: 'POST',
      body: validacao.data,
    });
    revalidatePath('/admin/clientes');
    return sucesso(cliente);
  } catch (erro) {
    return falha(erro);
  }
}

export async function atualizarCliente(id: string, entrada: unknown): Promise<Resultado> {
  const validacao = atualizarClienteSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao(`/clientes/${id}`, { method: 'PUT', body: validacao.data });
    revalidar(id);
    return sucesso(undefined);
  } catch (erro) {
    return falha(erro);
  }
}

/** Cria (anotacaoId null) ou edita um registro da ficha técnica. */
export async function salvarAnotacao(
  clienteId: string,
  anotacaoId: string | null,
  entrada: unknown,
): Promise<Resultado<AnotacaoCliente>> {
  const validacao = anotacaoClienteSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const caminho = `/clientes/${clienteId}/anotacoes${anotacaoId ? `/${anotacaoId}` : ''}`;
    const dados = await apiSalao<AnotacaoCliente>(caminho, {
      method: anotacaoId ? 'PUT' : 'POST',
      body: validacao.data,
    });
    revalidar(clienteId);
    return sucesso(dados);
  } catch (erro) {
    return falha(erro);
  }
}

export async function excluirAnotacao(clienteId: string, anotacaoId: string): Promise<Resultado> {
  try {
    await apiSalao(`/clientes/${clienteId}/anotacoes/${anotacaoId}`, { method: 'DELETE' });
    revalidar(clienteId);
    return sucesso(undefined);
  } catch (erro) {
    return falha(erro);
  }
}
