import { ROTULO_PERMISSAO, type Permissao } from '@salonflow/shared';
import { obterContextoAdmin, pode } from '@/lib/auth/contexto';

/** Mostra a área só se o dono liberou para a pessoa (a API também confere). */
export async function AreaProtegida({
  permissao,
  children,
}: {
  permissao: Permissao;
  children: React.ReactNode;
}) {
  const { salao } = await obterContextoAdmin();
  if (!pode(salao, permissao)) {
    return (
      <p className="text-sm text-suave">
        A área &ldquo;{ROTULO_PERMISSAO[permissao].rotulo}&rdquo; não está liberada para você. Fale
        com o dono do salão.
      </p>
    );
  }
  return children;
}
