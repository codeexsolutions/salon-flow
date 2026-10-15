import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { dataHoraLocalSchema, type SalaoPublico, type ServicoOnline } from '@salonflow/shared';
import { Agendar } from '@/components/cliente/agendar';
import { CabecalhoSalao } from '@/components/cliente/cabecalho-salao';
import { api, ApiError } from '@/lib/api/client';
import { obterSessao } from '@/lib/auth/sessao';
import { temaDoEstabelecimento } from '@/lib/cor-estabelecimento';

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

/** Página pública do estabelecimento, com a cor dele — também é o link que ele divulga. */
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
  const tema = temaDoEstabelecimento(salao.corDestaque);

  return (
    <div className={`flex flex-col gap-6 ${tema.className ?? ''}`} style={tema.style}>
      <CabecalhoSalao salao={salao} />

      {servicos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda p-8 text-center text-sm text-suave">
          Este estabelecimento ainda não oferece agendamento online.
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
