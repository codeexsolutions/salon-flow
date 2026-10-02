'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { criarSalaoSchema } from '@salonflow/shared';
import { api, ApiError } from '@/lib/api/client';
import { gravarSalaoAtivo } from '@/lib/auth/salao-ativo';
import { exigirSessao } from '@/lib/auth/sessao';

export interface EstadoNovoSalao {
  erros?: Partial<Record<'nome' | 'slug' | 'telefone' | 'cidade' | 'uf', string[]>>;
  mensagem?: string;
  valores?: Record<string, string>;
}

export async function criarSalao(
  _anterior: EstadoNovoSalao,
  formData: FormData,
): Promise<EstadoNovoSalao> {
  const sessao = await exigirSessao('/admin/novo-salao');

  const valores = Object.fromEntries(
    ['nome', 'slug', 'telefone', 'cidade', 'uf'].map((campo) => [
      campo,
      String(formData.get(campo) ?? '').trim(),
    ]),
  );
  // Campos opcionais vazios viram undefined para não falhar na validação.
  const entrada = Object.fromEntries(Object.entries(valores).filter(([, v]) => v !== ''));

  const validacao = criarSalaoSchema.safeParse(entrada);
  if (!validacao.success) {
    return { erros: z.flattenError(validacao.error).fieldErrors, valores };
  }

  let salaoId: string;
  try {
    const salao = await api<{ id: string }>('/saloes', {
      method: 'POST',
      token: sessao.token,
      body: validacao.data,
    });
    salaoId = salao.id;
  } catch (erro) {
    if (erro instanceof ApiError && erro.erro.codigo === 'SLUG_EM_USO') {
      return { erros: { slug: [erro.message] }, valores };
    }
    if (erro instanceof ApiError && erro.erro.statusCode === 400) {
      return { erros: erro.erro.detalhes as EstadoNovoSalao['erros'], valores };
    }
    return { mensagem: 'Não foi possível cadastrar o salão. Tente novamente.', valores };
  }

  await gravarSalaoAtivo(salaoId);
  redirect('/admin');
}
