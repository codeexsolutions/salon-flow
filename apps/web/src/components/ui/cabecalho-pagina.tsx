import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

/** Título da página, com subtítulo, link de volta e ações à direita. */
export function CabecalhoPagina({
  titulo,
  subtitulo,
  voltar,
  acoes,
}: {
  titulo: React.ReactNode;
  subtitulo?: React.ReactNode;
  voltar?: { href: string; rotulo: string };
  acoes?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1 print:hidden">
      {voltar && (
        <Link
          href={voltar.href}
          className="mb-1 inline-flex items-center gap-1 self-start text-sm text-suave hover:text-primaria"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {voltar.rotulo}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-sm text-suave">{subtitulo}</p>}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </div>
    </header>
  );
}
