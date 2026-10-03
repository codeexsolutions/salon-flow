import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { obterContextoPro, usaPainel } from '@/lib/auth/contexto';

/** Para quem também é dono ou recepção: volta ao painel do salão. */
export async function LinkPainel() {
  const { perfil } = await obterContextoPro();
  if (!perfil.saloes.some(usaPainel)) return null;

  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-1 text-xs font-medium text-suave hover:text-primaria"
    >
      <LayoutDashboard className="size-3.5" aria-hidden /> Painel do salão
    </Link>
  );
}
