'use server';

import { redirect } from 'next/navigation';
import { criarSupabaseServer } from '../supabase/server';
import { obterPerfil } from './sessao';
import { gravarSalaoAtivo } from './salao-ativo';

export async function sair() {
  const supabase = await criarSupabaseServer();
  await supabase.auth.signOut();
  redirect('/');
}

/** Troca o salão ativo do painel (só aceita salões em que o usuário atua). */
export async function trocarSalao(formData: FormData) {
  const salaoId = String(formData.get('salaoId') ?? '');
  const perfil = await obterPerfil('/admin');
  if (perfil.saloes.some((s) => s.id === salaoId)) {
    await gravarSalaoAtivo(salaoId);
  }
  redirect('/admin');
}
