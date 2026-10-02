'use server';

import { revalidatePath } from 'next/cache';
import { atualizarSalaoSchema, type SalaoConfiguracao } from '@salonflow/shared';
import { falha, falhaDeValidacao, sucesso, type Resultado } from '@/lib/api/resultado';
import { apiSalao } from '@/lib/api/salao';

/** Salva as configurações do salão (só o dono — a API confere). */
export async function salvarSalao(entrada: unknown): Promise<Resultado<SalaoConfiguracao>> {
  const validacao = atualizarSalaoSchema.safeParse(entrada);
  if (!validacao.success) return falhaDeValidacao(validacao.error);
  try {
    const salao = await apiSalao<SalaoConfiguracao>('/saloes/atual', {
      method: 'PATCH',
      body: validacao.data,
    });
    // Nome do salão aparece no menu e o endereço na página pública.
    revalidatePath('/admin', 'layout');
    revalidatePath(`/s/${salao.slug}`);
    return sucesso(salao);
  } catch (erro) {
    return falha(erro);
  }
}
