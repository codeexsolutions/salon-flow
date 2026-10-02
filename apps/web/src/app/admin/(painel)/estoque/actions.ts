'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  atualizarProdutoSchema,
  criarProdutoSchema,
  definirFichaTecnicaSchema,
  movimentarEstoqueSchema,
  textoParaCentavos,
  type ProdutoResumo,
} from '@salonflow/shared';
import { estadoDeErro, type EstadoForm } from '@/lib/api/estado-form';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { apiSalao } from '@/lib/api/salao';

/** Converte o formulário do produto (valores em reais, campos opcionais vazios). */
function lerProduto(formData: FormData) {
  const texto = (c: string) => String(formData.get(c) ?? '').trim();
  const reais = (c: string) =>
    texto(c) === '' ? null : (textoParaCentavos(texto(c)) ?? Number.NaN);
  const inteiro = (c: string) => (texto(c) === '' ? null : Number(texto(c)));
  return {
    nome: texto('nome'),
    marca: texto('marca') || null,
    unidade: texto('unidade'),
    tamanhoEmbalagem: inteiro('tamanhoEmbalagem') ?? undefined,
    custoEmbalagemCentavos: reais('custoEmbalagem') ?? undefined,
    precoVendaCentavos: reais('precoVenda'),
    estoqueMinimo: inteiro('estoqueMinimo'),
  };
}

function errosDeValidacao(erro: z.ZodError): EstadoForm {
  return {
    erros: z.flattenError(erro).fieldErrors as EstadoForm['erros'],
    mensagem: 'Confira os campos.',
  };
}

export async function criarProduto(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const { marca, precoVendaCentavos, estoqueMinimo, ...resto } = lerProduto(formData);
  const validacao = criarProdutoSchema.safeParse({
    ...resto,
    marca: marca ?? undefined,
    precoVendaCentavos: precoVendaCentavos ?? undefined,
    estoqueMinimo: estoqueMinimo ?? undefined,
  });
  if (!validacao.success) return errosDeValidacao(validacao.error);

  let id: string;
  try {
    ({ id } = await apiSalao<ProdutoResumo>('/produtos', { method: 'POST', body: validacao.data }));
  } catch (erro) {
    return estadoDeErro(erro, { NOME_EM_USO: 'nome' });
  }
  redirect(`/admin/estoque/${id}`);
}

export async function atualizarProduto(
  id: string,
  _: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const validacao = atualizarProdutoSchema.safeParse(lerProduto(formData));
  if (!validacao.success) return errosDeValidacao(validacao.error);
  try {
    await apiSalao(`/produtos/${id}`, { method: 'PATCH', body: validacao.data });
  } catch (erro) {
    return estadoDeErro(erro, { NOME_EM_USO: 'nome' });
  }
  revalidatePath(`/admin/estoque/${id}`);
  return { sucesso: true, mensagem: 'Produto salvo.' };
}

export async function alterarAtivoProduto(id: string, ativo: boolean) {
  await apiSalao(`/produtos/${id}`, { method: 'PATCH', body: { ativo } });
  revalidatePath('/admin/estoque', 'layout');
}

export async function movimentarEstoque(id: string, entrada: unknown): Promise<Resultado> {
  const validacao = movimentarEstoqueSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao(`/produtos/${id}/movimentos`, { method: 'POST', body: validacao.data });
  } catch (erro) {
    return falha(erro);
  }
  revalidatePath(`/admin/estoque/${id}`);
  revalidatePath('/admin/estoque');
  return sucesso(undefined);
}

export async function salvarFichaTecnica(servicoId: string, entrada: unknown): Promise<Resultado> {
  const validacao = definirFichaTecnicaSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao(`/servicos/${servicoId}/ficha-tecnica`, { method: 'PUT', body: validacao.data });
  } catch (erro) {
    return falha(erro);
  }
  revalidatePath(`/admin/servicos/${servicoId}`);
  return sucesso(undefined);
}
