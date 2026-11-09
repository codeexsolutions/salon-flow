import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ContratoDetalhe } from '@salonflow/shared';
import { DocumentoContrato } from '@/components/contratos/documento-contrato';
import { BotaoImprimir } from '@/components/ui/botao-imprimir';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Contrato de parceria' };

export default async function DocumentoContratoPage({
  params,
}: PageProps<'/admin/contratos/[id]/documento'>) {
  const { id } = await params;
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') notFound();

  let contrato: ContratoDetalhe;
  try {
    contrato = await apiSalao<ContratoDetalhe>(`/contratos/${id}`);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={`/admin/contratos/${id}`} className="text-sm text-suave">
          ← Voltar ao contrato
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-suave">
            Para PDF, escolha &ldquo;Salvar como PDF&rdquo;.
          </span>
          <BotaoImprimir rotulo="Imprimir / salvar PDF" />
        </div>
      </div>
      <DocumentoContrato contrato={contrato} />
    </div>
  );
}
