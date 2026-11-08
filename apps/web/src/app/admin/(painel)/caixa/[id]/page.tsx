import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CaixaDetalhe } from '@salonflow/shared';
import { ReabrirCaixa } from '@/components/caixa/reabrir-caixa';
import { ResumoCaixa } from '@/components/caixa/resumo-caixa';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { dataLocal, hojeNoFuso } from '@/lib/data-hora';

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

  const diaDoCaixa = dataLocal(caixa.abertoEm, salao.fusoHorario);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/caixa" className="text-sm text-suave">
        ← Caixa
      </Link>
      <ResumoCaixa caixa={caixa} fusoHorario={salao.fusoHorario} />
      {salao.papel === 'DONO' && caixa.status === 'FECHADO' && (
        <ReabrirCaixa
          caixaId={caixa.id}
          dataDoCaixa={diaDoCaixa.split('-').reverse().join('/')}
          ehDeHoje={diaDoCaixa === hojeNoFuso(salao.fusoHorario)}
        />
      )}
    </div>
  );
}
