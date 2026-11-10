'use server';

import { revalidatePath } from 'next/cache';
import {
  ajustePontosSchema,
  premioFidelidadeSchema,
  programaFidelidadeSchema,
  type MovimentoPontosDto,
  type PremioFidelidade,
  type ProgramaFidelidade,
} from '@salonflow/shared';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { apiSalao } from '@/lib/api/salao';

export async function salvarPrograma(entrada: unknown): Promise<Resultado<ProgramaFidelidade>> {
  const validacao = programaFidelidadeSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const dados = await apiSalao<ProgramaFidelidade>('/fidelidade/programa', {
      method: 'PUT',
      body: validacao.data,
    });
    revalidatePath('/admin/fidelidade');
    return sucesso(dados);
  } catch (erro) {
    return falha(erro);
  }
}

/** Cria (id null) ou altera um prêmio. */
export async function salvarPremio(
  id: string | null,
  entrada: unknown,
): Promise<Resultado<PremioFidelidade>> {
  const validacao = premioFidelidadeSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const dados = await apiSalao<PremioFidelidade>(
      id ? `/fidelidade/premios/${id}` : '/fidelidade/premios',
      { method: id ? 'PUT' : 'POST', body: validacao.data },
    );
    revalidatePath('/admin/fidelidade');
    return sucesso(dados);
  } catch (erro) {
    return falha(erro);
  }
}

export async function resgatarPremio(
  clienteId: string,
  premioId: string,
): Promise<Resultado<MovimentoPontosDto>> {
  try {
    const dados = await apiSalao<MovimentoPontosDto>(`/fidelidade/clientes/${clienteId}/resgates`, {
      method: 'POST',
      body: { premioId },
    });
    revalidatePath(`/admin/clientes/${clienteId}`);
    return sucesso(dados);
  } catch (erro) {
    return falha(erro);
  }
}

export async function ajustarPontos(
  clienteId: string,
  entrada: unknown,
): Promise<Resultado<MovimentoPontosDto>> {
  const validacao = ajustePontosSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const dados = await apiSalao<MovimentoPontosDto>(`/fidelidade/clientes/${clienteId}/ajustes`, {
      method: 'POST',
      body: validacao.data,
    });
    revalidatePath(`/admin/clientes/${clienteId}`);
    return sucesso(dados);
  } catch (erro) {
    return falha(erro);
  }
}
