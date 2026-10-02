import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { obterPerfil } from './sessao';
import { resolverSalaoAtivo } from './salao-ativo';

/**
 * Contexto do PAINEL: usuário + salão ativo em que ele é dono ou recepção.
 * Sem salão, manda para o cadastro. Use em todo layout/página/ação de /admin.
 */
export const obterContextoAdmin = cache(async () => {
  const perfil = await obterPerfil('/admin');
  const salao = await resolverSalaoAtivo(perfil.saloes, ['DONO', 'RECEPCAO']);
  if (!salao) redirect('/admin/novo-salao');
  return { perfil, salao };
});

/** Contexto do APP DO PROFISSIONAL. `salao` é null se ele não estiver vinculado a nenhum. */
export const obterContextoPro = cache(async () => {
  const perfil = await obterPerfil('/pro');
  const salao = await resolverSalaoAtivo(perfil.saloes, ['PROFISSIONAL']);
  return { perfil, salao };
});
