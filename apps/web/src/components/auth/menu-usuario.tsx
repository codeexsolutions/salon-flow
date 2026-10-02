import Link from 'next/link';
import { sair } from '@/lib/auth/actions';
import { obterSessao } from '@/lib/auth/sessao';

/** Links do cabeçalho conforme o usuário esteja logado ou não. */
export async function MenuUsuario() {
  const sessao = await obterSessao();

  if (!sessao) {
    return <Link href="/entrar">Entrar</Link>;
  }

  return (
    <>
      <Link href="/meus-agendamentos">Meus agendamentos</Link>
      <form action={sair}>
        <button type="submit" className="text-suave" title={sessao.email}>
          Sair
        </button>
      </form>
    </>
  );
}
