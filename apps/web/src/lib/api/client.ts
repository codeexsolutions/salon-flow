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

const TENTATIVAS_EXTRAS = 2;
const ESPERA_MS = 1500;

/** A API recusou a conexão (fora do ar ou reiniciando): o pedido nem chegou lá. */
function conexaoRecusada(erro: unknown): boolean {
  const causa = (erro as { cause?: { code?: string; errors?: { code?: string }[] } })?.cause;
  return (
    causa?.code === 'ECONNREFUSED' || !!causa?.errors?.some((e) => e.code === 'ECONNREFUSED')
  );
}

/**
 * Faz o fetch tentando de novo se a conexão for recusada. É seguro repetir mesmo
 * POST/PATCH: com conexão recusada a requisição não foi processada.
 */
async function fetchComNovaTentativa(url: string, init: RequestInit): Promise<Response> {
  for (let tentativa = 0; ; tentativa++) {
    try {
      return await fetch(url, init);
    } catch (erro) {
      if (tentativa >= TENTATIVAS_EXTRAS || !conexaoRecusada(erro)) throw erro;
      await new Promise((r) => setTimeout(r, ESPERA_MS));
    }
  }
}

/** Único ponto de acesso do front à API. Todas as chamadas passam por aqui. */
export async function api<T>(caminho: string, opcoes: OpcoesApi = {}): Promise<T> {
  const { token, salaoId, body, headers, ...resto } = opcoes;

  const resposta = await fetchComNovaTentativa(`${env.apiUrl}${caminho}`, {
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
