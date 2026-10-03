'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  atualizarProfissionalSchema,
  criarBloqueioSchema,
  criarProfissionalSchema,
  definirJornadaSchema,
  nomeUsuarioSchema,
  type ProfissionalResumo,
} from '@salonflow/shared';
import { estadoDeErro, type EstadoForm } from '@/lib/api/estado-form';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { apiSalao } from '@/lib/api/salao';

const ERROS_DE_CAMPO = {
  USUARIO_EM_USO: 'usuario',
  USUARIO_VINCULADO: 'usuario',
  USUARIO_EXISTE: 'usuario',
};

/** Lê os campos do FormData; vazio vira undefined (campo opcional não preenchido). */
function lerCampos(formData: FormData, campos: string[]) {
  return Object.fromEntries(
    campos.map((c) => [c, String(formData.get(c) ?? '').trim()]).filter(([, v]) => v !== ''),
  );
}

const CAMPOS_PROFISSIONAL = ['nome', 'usuario', 'telefone', 'corAgenda'];

export async function criarProfissional(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const validacao = criarProfissionalSchema.safeParse(lerCampos(formData, CAMPOS_PROFISSIONAL));
  if (!validacao.success) return { erros: z.flattenError(validacao.error).fieldErrors };

  let id: string;
  try {
    ({ id } = await apiSalao<ProfissionalResumo>('/profissionais', {
      method: 'POST',
      body: validacao.data,
    }));
  } catch (erro) {
    return estadoDeErro(erro, ERROS_DE_CAMPO);
  }
  redirect(`/admin/profissionais/${id}`);
}

export async function atualizarProfissional(
  id: string,
  _: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const campos = lerCampos(formData, CAMPOS_PROFISSIONAL);
  // Campo opcional apagado no formulário vira null para ser limpo no banco.
  const dados = { ...campos, usuario: campos.usuario ?? null, telefone: campos.telefone ?? null };
  const validacao = atualizarProfissionalSchema.safeParse(dados);
  if (!validacao.success) return { erros: z.flattenError(validacao.error).fieldErrors };

  try {
    await apiSalao(`/profissionais/${id}`, { method: 'PATCH', body: validacao.data });
  } catch (erro) {
    return estadoDeErro(erro, ERROS_DE_CAMPO);
  }
  revalidatePath(`/admin/profissionais/${id}`);
  return { sucesso: true, mensagem: 'Dados salvos.' };
}

export async function alterarAtivo(id: string, ativo: boolean) {
  await apiSalao(`/profissionais/${id}`, { method: 'PATCH', body: { ativo } });
  revalidatePath('/admin/profissionais', 'layout');
}

export async function salvarJornada(
  id: string,
  _: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  let intervalos: unknown;
  try {
    intervalos = JSON.parse(String(formData.get('intervalos') ?? '[]'));
  } catch {
    return { mensagem: 'Jornada inválida.' };
  }
  const validacao = definirJornadaSchema.safeParse({ intervalos });
  if (!validacao.success) return { mensagem: 'Confira os horários preenchidos.' };

  try {
    await apiSalao(`/profissionais/${id}/jornada`, { method: 'PUT', body: validacao.data });
  } catch (erro) {
    return estadoDeErro(erro);
  }
  revalidatePath(`/admin/profissionais/${id}`);
  return { sucesso: true, mensagem: 'Jornada salva.' };
}

export async function criarBloqueio(
  id: string,
  _: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  const validacao = criarBloqueioSchema.safeParse(lerCampos(formData, ['inicio', 'fim', 'motivo']));
  if (!validacao.success) return { erros: z.flattenError(validacao.error).fieldErrors };

  try {
    await apiSalao(`/profissionais/${id}/bloqueios`, { method: 'POST', body: validacao.data });
  } catch (erro) {
    return estadoDeErro(erro);
  }
  revalidatePath(`/admin/profissionais/${id}`);
  return { sucesso: true, mensagem: 'Folga adicionada.' };
}

export async function removerBloqueio(id: string, bloqueioId: string) {
  await apiSalao(`/profissionais/${id}/bloqueios/${bloqueioId}`, { method: 'DELETE' });
  revalidatePath(`/admin/profissionais/${id}`);
}

/** Define o usuário do profissional antes de criar o acesso dele ao app. */
export async function definirUsuarioProfissional(id: string, usuario: string): Promise<Resultado> {
  const validacao = nomeUsuarioSchema.safeParse(usuario);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    await apiSalao(`/profissionais/${id}`, { method: 'PATCH', body: { usuario: validacao.data } });
  } catch (erro) {
    return falha(erro);
  }
  revalidatePath(`/admin/profissionais/${id}`);
  return sucesso(undefined);
}

/** Desfaz o usuário reservado quando a conta não pôde ser criada (ex.: já é de outra pessoa). */
export async function limparUsuarioProfissional(id: string): Promise<Resultado> {
  try {
    await apiSalao(`/profissionais/${id}`, { method: 'PATCH', body: { usuario: null } });
  } catch (erro) {
    return falha(erro);
  }
  revalidatePath(`/admin/profissionais/${id}`);
  return sucesso(undefined);
}
