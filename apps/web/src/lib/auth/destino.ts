import type { PerfilUsuario } from '@salonflow/shared';

/** Aceita só caminhos internos (evita redirecionar para outro site via ?next=). */
export function caminhoSeguro(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return null;
  }
  return next;
}

/**
 * Para onde mandar o usuário depois do login, conforme os papéis dele.
 * Sem vínculo com salão, vale o perfil escolhido ao criar a conta (`tipoConta`):
 * quem disse "Tenho um salão" retoma o cadastro do salão.
 */
export function destinoPorPapel(perfil: PerfilUsuario, tipoConta?: string): string {
  if (perfil.saloes.some((s) => s.papel === 'DONO' || s.papel === 'RECEPCAO')) return '/admin';
  if (perfil.saloes.some((s) => s.papel === 'PROFISSIONAL')) return '/pro';
  if (tipoConta === 'salao') return '/admin/novo-salao';
  if (tipoConta === 'profissional') return '/pro';
  return '/';
}
