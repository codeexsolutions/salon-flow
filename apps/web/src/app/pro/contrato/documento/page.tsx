import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocumentoContrato } from '@/components/contratos/documento-contrato';
import { BotaoImprimir } from '@/components/ui/botao-imprimir';
import { meuContrato } from '@/lib/api/contrato-pro';

export const metadata = { title: 'Contrato de parceria' };

export default async function ProDocumentoContratoPage() {
  const contrato = await meuContrato();
  if (!contrato) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link href="/pro/contrato" className="text-sm text-suave">
          ← Meu contrato
        </Link>
        <BotaoImprimir rotulo="Baixar / imprimir" />
      </div>
      <p className="text-xs text-suave print:hidden">
        Para baixar em PDF, toque em &ldquo;Baixar / imprimir&rdquo; e escolha &ldquo;Salvar como
        PDF&rdquo;.
      </p>
      <DocumentoContrato contrato={contrato} />
    </div>
  );
}
