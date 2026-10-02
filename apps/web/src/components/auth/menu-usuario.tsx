import Link from 'next/link';
import { CalendarHeart, KeyRound, LogOut } from 'lucide-react';
import { sair } from '@/lib/auth/actions';
import { obterSessao } from '@/lib/auth/sessao';

/** Links do cabeçalho conforme o usuário esteja logado ou não. */
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
        className="text-suave hover:text-primaria"
        aria-label="Alterar senha"
        title="Alterar senha"
      >
        <KeyRound className="size-4" aria-hidden />
      </Link>
      <form action={sair}>
        <button
          type="submit"
          className="text-suave hover:text-perigo"
          aria-label="Sair"
          title={`Sair (${sessao.email})`}
        >
          <LogOut className="size-4" aria-hidden />
        </button>
      </form>
    </>
  );
}
