import 'server-only';
import { obterContextoPro } from '../auth/contexto';
import { exigirSessao } from '../auth/sessao';
import { api } from './client';

type OpcoesApi = NonNullable<Parameters<typeof api>[1]>;

/** Chamada à API no salão do app do profissional (token + header x-salao-id). */
export async function apiPro<T>(
  caminho: string,
  opcoes: Omit<OpcoesApi, 'token' | 'salaoId'> = {},
) {
  const [{ salao }, sessao] = await Promise.all([obterContextoPro(), exigirSessao('/pro')]);
  if (!salao) throw new Error('Você ainda não está em nenhum salão.');
  return api<T>(caminho, { cache: 'no-store', ...opcoes, token: sessao.token, salaoId: salao.id });
}
