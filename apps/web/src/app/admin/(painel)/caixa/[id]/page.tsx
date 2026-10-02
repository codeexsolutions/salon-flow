import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CaixaDetalhe } from '@salonflow/shared';
import { ResumoCaixa } from '@/components/caixa/resumo-caixa';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Caixa' };

export default async function CaixaDetalhePage({ params }: PageProps<'/admin/caixa/[id]'>) {
  const { id } = await params;
  const { salao } = await obterContextoAdmin();
  let caixa: CaixaDetalhe;
  try {
    caixa = await apiSalao<CaixaDetalhe>(`/caixa/${id}`);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/caixa" className="text-sm text-suave">
        ← Caixa
      </Link>
      <ResumoCaixa caixa={caixa} fusoHorario={salao.fusoHorario} />
    </div>
  );
}
