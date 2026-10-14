import Link from 'next/link';
import { CalendarHeart, UserRound } from 'lucide-react';
import { obterSessao } from '@/lib/auth/sessao';

/**
 * Links do cabeçalho conforme o usuário esteja logado ou não. Senha, código de
 * recuperação e "Sair" ficam na página da conta, não no cabeçalho.
 */
export async function MenuUsuario() {
  const sessao = await obterSessao();

  if (!sessao) {
    return (
      <Link
        href="/entrar"
        className="rounded-xl bg-primaria px-4 py-2 text-sm font-medium text-primaria-contraste hover:bg-primaria-hover"
      >
        Entrar
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/meus-agendamentos"
        className="inline-flex items-center gap-1.5 hover:text-primaria"
      >
        <CalendarHeart className="size-4" aria-hidden />
        <span className="hidden sm:inline">Meus agendamentos</span>
        <span className="sm:hidden">Agenda</span>
      </Link>
      <Link
        href="/conta/senha"
        className="inline-flex items-center gap-1.5 hover:text-primaria"
        title={`Minha conta (@${sessao.usuario})`}
      >
        <UserRound className="size-4" aria-hidden />
        Conta
      </Link>
    </>
  );
}
