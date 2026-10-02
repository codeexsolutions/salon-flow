import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { dataHoraLocalSchema, type SalaoPublico, type ServicoOnline } from '@salonflow/shared';
import { Agendar } from '@/components/cliente/agendar';
import { linkWhatsApp } from '@/lib/agenda';
import { api, ApiError } from '@/lib/api/client';
import { obterSessao } from '@/lib/auth/sessao';

const buscarSalao = cache(async (slug: string) => {
  try {
    return await api<SalaoPublico>(`/saloes/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  } catch (erro) {
    if (erro instanceof ApiError && erro.erro.statusCode === 404) notFound();
    throw erro;
  }
});

export async function generateMetadata({ params }: PageProps<'/s/[slug]'>): Promise<Metadata> {
  const salao = await buscarSalao((await params).slug);
  return { title: `Agendar em ${salao.nome}` };
}

/** Página pública do salão — também é o link direto que o salão divulga. */
export default async function SalaoPage({ params, searchParams }: PageProps<'/s/[slug]'>) {
  const { slug } = await params;
  const consulta = await searchParams;
  const [salao, servicos, sessao] = await Promise.all([
    buscarSalao(slug),
    api<ServicoOnline[]>(`/publico/saloes/${encodeURIComponent(slug)}/servicos`, {
      cache: 'no-store',
    }),
    obterSessao(),
  ]);

  // Voltando do login: retoma a escolha que o cliente tinha feito.
  const texto = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);
  const inicio = texto(consulta.inicio);
  const whatsapp = salao.telefone && linkWhatsApp(salao.telefone);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{salao.nome}</h1>
        <p className="text-sm text-suave">
          {[salao.cidade && `${salao.cidade}${salao.uf ? ` - ${salao.uf}` : ''}`, salao.telefone]
            .filter(Boolean)
            .join(' · ')}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="ml-2 text-sucesso underline"
            >
              WhatsApp
            </a>
          )}
        </p>
      </header>

      {servicos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda p-8 text-center text-sm text-suave">
          Este salão ainda não oferece agendamento online.
        </p>
      ) : (
        <Agendar
          slug={slug}
          fusoHorario={salao.fusoHorario}
          servicos={servicos}
          logado={!!sessao}
          inicial={{
            servicoId: texto(consulta.servico),
            profissionalId: texto(consulta.prof),
            inicio: inicio && dataHoraLocalSchema.safeParse(inicio).success ? inicio : undefined,
          }}
        />
      )}
    </div>
  );
}
