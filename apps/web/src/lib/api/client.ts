import { HEADER_SALAO_ID, type ApiErro } from '@salonflow/shared';
import { env } from '../env';

export class ApiError extends Error {
  constructor(readonly erro: ApiErro) {
    super(erro.mensagem);
  }
}

interface OpcoesApi extends Omit<RequestInit, 'body'> {
  /** Access token do Supabase (usuário logado). */
  token?: string;
  /** Salão ativo — obrigatório nas rotas do painel e do app do profissional. */
  salaoId?: string;
  body?: unknown;
}

/** Único ponto de acesso do front à API. Todas as chamadas passam por aqui. */
export async function api<T>(caminho: string, opcoes: OpcoesApi = {}): Promise<T> {
  const { token, salaoId, body, headers, ...resto } = opcoes;

  const resposta = await fetch(`${env.apiUrl}${caminho}`, {
    ...resto,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(salaoId && { [HEADER_SALAO_ID]: salaoId }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!resposta.ok) {
    const erro = (await resposta.json().catch(() => null)) as ApiErro | null;
    throw new ApiError(
      erro ?? { statusCode: resposta.status, codigo: 'ERRO', mensagem: resposta.statusText },
    );
  }

  return resposta.status === 204 ? (undefined as T) : ((await resposta.json()) as T);
}
