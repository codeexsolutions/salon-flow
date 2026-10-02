import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

/** Cartão de indicador do painel (número grande + legenda). */
export function Indicador({
  rotulo,
  valor,
  detalhe,
  icone: Icone,
  href,
  destaque = false,
}: {
  rotulo: string;
  valor: React.ReactNode;
  detalhe?: React.ReactNode;
  icone: LucideIcon;
  href?: string;
  /** Realça o cartão (ex.: algo pedindo atenção). */
  destaque?: boolean;
}) {
  const conteudo = (
    <>
      <span className="flex items-center justify-between gap-2 text-sm text-suave">
        {rotulo}
        <span
          className={`flex size-9 items-center justify-center rounded-full ${
            destaque ? 'bg-alerta-suave text-alerta' : 'bg-nude text-primaria'
          }`}
        >
          <Icone className="size-[18px]" aria-hidden />
        </span>
      </span>
      <span className="font-display text-3xl">{valor}</span>
      {detalhe && <span className="text-xs text-suave">{detalhe}</span>}
    </>
  );
  const classe =
    'flex flex-col gap-1 rounded-2xl border border-borda bg-superficie p-5 shadow-[0_1px_2px_rgb(58_42_43/0.04)]';

  return href ? (
    <Link href={href} className={`${classe} transition hover:border-primaria/40 hover:shadow-md`}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}
