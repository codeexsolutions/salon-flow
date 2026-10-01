import { notFound } from 'next/navigation';
import type { SalaoPublico } from '@salonflow/shared';
import { api, ApiError } from '@/lib/api/client';

async function buscarSalao(slug: string) {
  try {
    return await api<SalaoPublico>(`/saloes/${encodeURIComponent(slug)}`);
  } catch (erro) {
    if (erro instanceof ApiError && erro.erro.statusCode === 404) notFound();
    throw erro;
  }
}

/** Página pública do salão — também é o link direto que o salão divulga. */
export default async function SalaoPage({ params }: PageProps<'/s/[slug]'>) {
  const { slug } = await params;
  const salao = await buscarSalao(slug);

  return (
    <section>
      <h1 className="text-2xl font-bold">{salao.nome}</h1>
      {salao.cidade && (
        <p className="text-sm text-suave">
          {salao.cidade}
          {salao.uf && ` - ${salao.uf}`}
        </p>
      )}
      <p className="mt-6 text-sm text-suave">Serviços, profissionais e horários: em breve.</p>
    </section>
  );
}
