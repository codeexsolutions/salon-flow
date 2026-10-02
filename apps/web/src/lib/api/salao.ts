import 'server-only';
import { obterContextoAdmin } from '../auth/contexto';
import { exigirSessao } from '../auth/sessao';
import { api } from './client';

type OpcoesApi = NonNullable<Parameters<typeof api>[1]>;

/** Chamada à API no contexto do salão ativo do painel (token + header x-salao-id). */
export async function apiSalao<T>(
  caminho: string,
  opcoes: Omit<OpcoesApi, 'token' | 'salaoId'> = {},
) {
  const [{ salao }, sessao] = await Promise.all([obterContextoAdmin(), exigirSessao('/admin')]);
  return api<T>(caminho, { cache: 'no-store', ...opcoes, token: sessao.token, salaoId: salao.id });
}
