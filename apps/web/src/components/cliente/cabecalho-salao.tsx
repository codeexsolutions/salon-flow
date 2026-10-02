import { AtSign, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { SalaoPublico } from '@salonflow/shared';
import { linkWhatsApp } from '@/lib/agenda';
import { linkMapa } from '@/lib/mapa';

/** Topo da página pública do salão: capa, logo, contatos, endereço e descrição. */
export function CabecalhoSalao({ salao }: { salao: SalaoPublico }) {
  const whatsapp = salao.telefone && linkWhatsApp(salao.telefone);
  const local = [salao.bairro, salao.cidade && `${salao.cidade}${salao.uf ? ` - ${salao.uf}` : ''}`]
    .filter(Boolean)
    .join(', ');
  const mapa = linkMapa([salao.endereco, salao.bairro, salao.cidade, salao.uf]);

  return (
    <header className="overflow-hidden rounded-3xl border border-borda bg-superficie">
      <div
        className={`aspect-[3/1] max-h-56 w-full bg-gradient-to-br from-[#a35866] to-[#6e3540] ${
          salao.capaUrl ? '' : 'opacity-90'
        }`}
      >
        {salao.capaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={salao.capaUrl} alt="" className="size-full object-cover" />
        )}
      </div>

      <div className="flex flex-col gap-4 px-5 pb-5 sm:px-8">
        <div className="relative z-10 -mt-10 flex items-end gap-4">
          <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-superficie bg-nude font-display text-3xl text-primaria shadow-sm sm:size-24">
            {salao.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={salao.logoUrl}
                alt={`Logo de ${salao.nome}`}
                className="size-full object-cover"
              />
            ) : (
              salao.nome.charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0 pb-1">
            <h1 className="truncate text-3xl">{salao.nome}</h1>
            {local && <p className="text-sm text-suave">{local}</p>}
          </div>
        </div>

        {salao.descricao && <p className="text-sm whitespace-pre-line">{salao.descricao}</p>}

        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {salao.endereco && (
            <li>
              <a
                href={mapa ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-primaria"
              >
                <MapPin className="size-4 text-primaria" aria-hidden />
                {salao.endereco}
              </a>
            </li>
          )}
          {salao.telefone && (
            <li className="inline-flex items-center gap-1.5">
              <Phone className="size-4 text-primaria" aria-hidden />
              {salao.telefone}
            </li>
          )}
          {whatsapp && (
            <li>
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sucesso hover:underline"
              >
                <MessageCircle className="size-4" aria-hidden /> WhatsApp
              </a>
            </li>
          )}
          {salao.instagram && (
            <li>
              <a
                href={`https://instagram.com/${salao.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-primaria"
              >
                <AtSign className="size-4 text-primaria" aria-hidden />
                {salao.instagram}
              </a>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}
