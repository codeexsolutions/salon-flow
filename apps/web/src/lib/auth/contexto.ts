import 'server-only';
import { cache } from 'react';
import type { VinculoSalao } from '@salonflow/shared';
import { redirect } from 'next/navigation';
import { obterPerfil } from './sessao';
import { resolverSalaoAtivo } from './salao-ativo';

/** Dono e recepção usam o painel. */
export const usaPainel = (s: VinculoSalao) => s.papel === 'DONO' || s.papel === 'RECEPCAO';

/** O app do profissional vale para quem atende no salão, mesmo sendo dono ou recepção. */
export const usaAppProfissional = (s: VinculoSalao) => s.papel === 'PROFISSIONAL' || s.ehProfissional;

/**
 * Contexto do PAINEL: usuário + salão ativo em que ele é dono ou recepção.
 * Sem salão, manda para o cadastro. Use em todo layout/página/ação de /admin.
 */
export const obterContextoAdmin = cache(async () => {
  const perfil = await obterPerfil('/admin');
  const salao = await resolverSalaoAtivo(perfil.saloes, usaPainel);
  if (!salao) redirect('/admin/novo-salao');
  return { perfil, salao };
});

/** Contexto do APP DO PROFISSIONAL. `salao` é null se ele não estiver vinculado a nenhum. */
export const obterContextoPro = cache(async () => {
  const perfil = await obterPerfil('/pro');
  const salao = await resolverSalaoAtivo(perfil.saloes, usaAppProfissional);
  return { perfil, salao };
});
