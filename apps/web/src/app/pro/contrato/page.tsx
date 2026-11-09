import Link from 'next/link';
import { Download, FileText } from 'lucide-react';
import { formatarPercentual, ROTULO_PERIODICIDADE } from '@salonflow/shared';
import { StatusContratoBadge } from '@/components/contratos/status-contrato';
import { classeBotaoPrimario, classeBotaoSecundario } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';
import { meuContrato } from '@/lib/api/contrato-pro';

export const metadata = { title: 'Meu contrato' };

const dataCurta = (d: string | null) => (d ? d.split('-').reverse().join('/') : '—');

export default async function ProContratoPage() {
  const contrato = await meuContrato();

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl">Meu contrato</h1>
        <p className="text-sm text-suave">Contrato de parceria com o salão (Lei 13.352/2016).</p>
      </div>

      {!contrato ? (
        <p className="rounded-xl border border-borda bg-superficie p-4 text-sm text-suave">
          O salão ainda não cadastrou o seu contrato de parceria.
        </p>
      ) : (
        <>
          <Secao titulo={contrato.salaoRazaoSocial}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-suave">Situação</dt>
              <dd>
                <StatusContratoBadge status={contrato.status} />
              </dd>
              <dt className="text-suave">Sua cota</dt>
              <dd>{formatarPercentual(contrato.cotaProfissionalBps)} de cada serviço</dd>
              <dt className="text-suave">Pagamento</dt>
              <dd>{ROTULO_PERIODICIDADE[contrato.periodicidade]}</dd>
              <dt className="text-suave">Início</dt>
              <dd>{dataCurta(contrato.inicioEm)}</dd>
              {contrato.encerradoEm && (
                <>
                  <dt className="text-suave">Encerrado em</dt>
                  <dd>{dataCurta(contrato.encerradoEm)}</dd>
                </>
              )}
            </dl>
          </Secao>

          <Link href="/pro/contrato/documento" className={`${classeBotaoPrimario} w-full`}>
            <FileText className="size-4" aria-hidden /> Ver e baixar o contrato
          </Link>
          {contrato.temArquivo && (
            <a href="/pro/contrato/arquivo" className={`${classeBotaoSecundario} w-full`}>
              <Download className="size-4" aria-hidden /> Baixar PDF assinado
            </a>
          )}
        </>
      )}
    </section>
  );
}
