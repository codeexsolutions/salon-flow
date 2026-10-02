import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { RepasseDetalhe } from '@salonflow/shared';
import { ComprovanteRepasse } from '@/components/comissoes/comprovante-repasse';
import { BotaoImprimir } from '@/components/ui/botao-imprimir';
import { classeBotaoSecundario } from '@/components/ui/campo';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { cancelarRepasse } from '../../actions';

export const metadata = { title: 'Repasse' };

export default async function RepassePage({ params }: PageProps<'/admin/comissoes/repasses/[id]'>) {
  const { id } = await params;
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') {
    return <p className="text-sm text-suave">Apenas o dono do salão acessa os repasses.</p>;
  }

  let repasse: RepasseDetalhe;
  try {
    repasse = await apiSalao<RepasseDetalhe>(`/comissoes/repasses/${id}`);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/admin/comissoes" className="text-sm text-suave">
          ← Comissões
        </Link>
        <div className="flex gap-2">
          <BotaoImprimir />
          {repasse.status === 'PAGO' && (
            <form action={cancelarRepasse.bind(null, repasse.id)}>
              <button type="submit" className={`${classeBotaoSecundario} text-perigo`}>
                Cancelar repasse
              </button>
            </form>
          )}
        </div>
      </div>
      <ComprovanteRepasse repasse={repasse} />
    </div>
  );
}
