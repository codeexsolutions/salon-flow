import { ROTULO_PERMISSAO, type Permissao } from '@salonflow/shared';
import { obterContextoAdmin, pode } from '@/lib/auth/contexto';

/** Mostra a área só se o dono liberou para a pessoa (a API também confere). */
export async function AreaProtegida({
  permissao,
  children,
}: {
  /** Uma ou várias (qualquer uma libera; a primeira dá nome à área). */
  permissao: Permissao | Permissao[];
  children: React.ReactNode;
}) {
  const { salao } = await obterContextoAdmin();
  const lista = [permissao].flat();
  if (!lista.some((p) => pode(salao, p))) {
    return (
      <p className="text-sm text-suave">
        A área &ldquo;{ROTULO_PERMISSAO[lista[0]].rotulo}&rdquo; não está liberada para você. Fale
        com o dono do salão.
      </p>
    );
  }
  return children;
}
