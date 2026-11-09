import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText } from 'lucide-react';
import type { ContratoDetalhe, ServicoResumo } from '@salonflow/shared';
import {
  AtivarContrato,
  EncerrarContrato,
  EnviarPdf,
  ExcluirRascunho,
} from '@/components/contratos/acoes-contrato';
import { FormContrato } from '@/components/contratos/form-contrato';
import { StatusContratoBadge } from '@/components/contratos/status-contrato';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { classeBotaoPrimario } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { hojeNoFuso } from '@/lib/data-hora';

export const metadata = { title: 'Contrato' };

const dataCurta = (d: string | null) => (d ? d.split('-').reverse().join('/') : '');

export default async function ContratoPage({ params }: PageProps<'/admin/contratos/[id]'>) {
  const { id } = await params;
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') {
    return <p className="text-sm text-suave">Apenas o dono do salão acessa os contratos.</p>;
  }

  let contrato: ContratoDetalhe;
  try {
    contrato = await apiSalao<ContratoDetalhe>(`/contratos/${id}`);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }
  const servicos = await apiSalao<ServicoResumo[]>('/servicos?incluirInativos=true');
  const encerrado = contrato.status === 'ENCERRADO';

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <CabecalhoPagina
        titulo={`Contrato · ${contrato.profissionalNome}`}
        subtitulo={<StatusContratoBadge status={contrato.status} />}
        voltar={{ href: '/admin/contratos', rotulo: 'Contratos' }}
        acoes={
          <Link href={`/admin/contratos/${id}/documento`} className={classeBotaoPrimario}>
            <FileText className="size-4" aria-hidden /> Gerar contrato para imprimir
          </Link>
        }
      />

      {contrato.status === 'RASCUNHO' && (
        <Secao
          titulo="Próximos passos"
          descricao="1) Gere o contrato e imprima. 2) Assine com o profissional e duas testemunhas. 3) Homologue no sindicato (ou no Ministério do Trabalho). 4) Preencha a formalização abaixo e ative."
        >
          <AtivarContrato id={id} pendencias={contrato.pendencias} />
          <ExcluirRascunho id={id} />
        </Secao>
      )}

      {encerrado && (
        <Secao titulo="Parceria encerrada">
          <p className="text-sm">
            Aviso prévio em {dataCurta(contrato.avisoPrevioEm)}, encerrada em{' '}
            {dataCurta(contrato.encerradoEm)}
            {contrato.comumAcordo && ' (comum acordo)'}. Motivo: {contrato.motivoEncerramento}
          </p>
        </Secao>
      )}

      <Secao
        titulo="Contrato assinado (PDF)"
        descricao="Depois de homologado, envie o PDF escaneado. O profissional também consegue baixá-lo pelo app."
      >
        <EnviarPdf id={id} temArquivo={contrato.temArquivo} />
      </Secao>

      {!encerrado && (
        <FormContrato
          id={id}
          inicial={contrato}
          servicos={servicos.map((s) => ({ id: s.id, nome: s.nome }))}
          somenteFormalizacao={contrato.status === 'ATIVO'}
        />
      )}

      {contrato.status === 'ATIVO' && (
        <Secao titulo="Encerrar parceria">
          <EncerrarContrato id={id} hoje={hojeNoFuso(salao.fusoHorario)} />
        </Secao>
      )}
    </div>
  );
}
