import Link from 'next/link';
import { SinoNotificacoes } from '@/components/pwa/sino-notificacoes';
import { obterSessao } from '@/lib/auth/sessao';

/**
 * Canto direito do cabeçalho: sino (logado) ou "Entrar". A navegação fica na
 * barra inferior (celular) ou no menu do topo (computador).
 */
export async function MenuUsuario() {
  const sessao = await obterSessao();

  if (!sessao) {
    return (
      <Link
        href="/entrar"
        className="rounded-xl bg-botao px-4 py-2 text-sm font-medium text-botao-contraste hover:bg-botao-hover"
      >
        Entrar
      </Link>
    );
  }

  return <SinoNotificacoes />;
}
