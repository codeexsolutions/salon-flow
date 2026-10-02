import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import type { SalaoMarketplace } from '@salonflow/shared';

/** Cartão de salão na busca/diretório. */
export function CartaoSalao({ salao: s }: { salao: SalaoMarketplace }) {
  const local = [s.bairro, s.cidade && `${s.cidade}${s.uf ? ` - ${s.uf}` : ''}`]
    .filter(Boolean)
    .join(', ');

  return (
    <Link
      href={`/s/${s.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-borda bg-superficie transition hover:-translate-y-0.5 hover:border-primaria/40 hover:shadow-md"
    >
      <div className="h-24 bg-gradient-to-br from-[#a35866] to-[#6e3540]">
        {s.capaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.capaUrl} alt="" className="size-full object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 pt-0">
        <span className="relative -mt-7 flex size-14 items-center justify-center overflow-hidden rounded-full border-4 border-superficie bg-nude font-display text-xl text-primaria">
          {s.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logoUrl} alt="" className="size-full object-cover" />
          ) : (
            s.nome.charAt(0).toUpperCase()
          )}
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-medium">{s.nome}</span>
          {local && (
            <span className="inline-flex items-center gap-1 text-sm text-suave">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {local}
            </span>
          )}
          {s.descricao && <span className="line-clamp-2 text-xs text-suave">{s.descricao}</span>}
        </span>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primaria">
          {s.totalServicos > 0 ? `${s.totalServicos} serviço(s) · Agendar` : 'Ver salão'}
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
