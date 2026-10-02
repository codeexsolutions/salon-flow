'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  atualizarServicoSchema,
  criarServicoSchema,
  definirProfissionaisServicoSchema,
  textoParaCentavos,
  type ServicoResumo,
} from '@salonflow/shared';
import { estadoDeErro, type EstadoForm } from '@/lib/api/estado-form';
import { apiSalao } from '@/lib/api/salao';

const ERROS_DE_CAMPO = { NOME_EM_USO: 'nome' };

/** Converte o formulário de serviço para o formato da API (preço em centavos etc.). */
function lerServico(formData: FormData) {
  const texto = (campo: string) => String(formData.get(campo) ?? '').trim();
  const preco = texto('preco');
  const duracao = texto('duracaoMin');

  return {
    nome: texto('nome'),
    descricao: texto('descricao') || null,
    categoria: texto('categoria') || null,
    precoCentavos: preco === '' ? undefined : (textoParaCentavos(preco) ?? Number.NaN),
    duracaoMin: duracao === '' ? undefined : Number(duracao),
    visivelOnline: formData.get('visivelOnline') === 'on',
  };
}

function errosDeValidacao(erro: z.ZodError): EstadoForm {
  const erros = z.flattenError(erro).fieldErrors as Record<string, string[] | undefined>;
  if (erros.precoCentavos) erros.precoCentavos = ['Informe um preço válido, ex.: 45,00'];
  return { erros };
}

export async function criarServico(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const { descricao, categoria, ...resto } = lerServico(formData);
  const validacao = criarServicoSchema.safeParse({
    ...resto,
    descricao: descricao ?? undefined,
    categoria: categoria ?? undefined,
  });
  if (!validacao.success) return errosDeValidacao(validacao.error);

  let id: string;
  try {
    ({ id } = await apiSalao<ServicoResumo>('/servicos', { method: 'POST', body: validacao.data }));
  } catch (erro) {
    return estadoDeErro(erro, ERROS_DE_CAMPO);
  }
  redirect(`/admin/servicos/${id}`);
}

export async function atualizarServico(
  id: string,
  _: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const validacao = atualizarServicoSchema.safeParse(lerServico(formData));
  if (!validacao.success) return errosDeValidacao(validacao.error);

  try {
    await apiSalao(`/servicos/${id}`, { method: 'PATCH', body: validacao.data });
  } catch (erro) {
    return estadoDeErro(erro, ERROS_DE_CAMPO);
  }
  revalidatePath(`/admin/servicos/${id}`);
  return { sucesso: true, mensagem: 'Serviço salvo.' };
}

export async function alterarAtivoServico(id: string, ativo: boolean) {
  await apiSalao(`/servicos/${id}`, { method: 'PATCH', body: { ativo } });
  revalidatePath('/admin/servicos', 'layout');
}

export async function salvarProfissionaisServico(
  id: string,
  _: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  let profissionais: unknown;
  try {
    profissionais = JSON.parse(String(formData.get('profissionais') ?? '[]'));
  } catch {
    return { mensagem: 'Lista inválida.' };
  }
  const validacao = definirProfissionaisServicoSchema.safeParse({ profissionais });
  if (!validacao.success) {
    return { mensagem: 'Confira os preços e durações (duração em múltiplos de 5 minutos).' };
  }

  try {
    await apiSalao(`/servicos/${id}/profissionais`, { method: 'PUT', body: validacao.data });
  } catch (erro) {
    return estadoDeErro(erro);
  }
  revalidatePath(`/admin/servicos/${id}`);
  return { sucesso: true, mensagem: 'Profissionais salvos.' };
}
