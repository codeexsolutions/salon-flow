import type {
  ContratoDetalhe,
  ContratoResumo,
  FuncaoParceiro,
  Testemunha,
} from '@salonflow/shared';
import type { ContratoParceria } from '../../generated/prisma/client.js';
import { pendenciasParaAtivar } from './domain/contrato.js';

type ContratoComArquivo = ContratoParceria & { arquivo: { nome: string } | null };

const data = (d: Date) => d.toISOString().slice(0, 10);
const dataOuNull = (d: Date | null) => (d ? data(d) : null);
const testemunhasDe = (c: ContratoParceria) =>
  (Array.isArray(c.testemunhas) ? c.testemunhas : []) as unknown as Testemunha[];

function pendencias(c: ContratoParceria) {
  return c.status === 'RASCUNHO'
    ? pendenciasParaAtivar({
        assinadoEm: dataOuNull(c.assinadoEm),
        homologacao: c.homologacao,
        homologadoEm: dataOuNull(c.homologadoEm),
        testemunhas: testemunhasDe(c),
      })
    : [];
}

export function paraContratoResumo(c: ContratoComArquivo): ContratoResumo {
  return {
    id: c.id,
    profissionalId: c.profissionalId,
    profissionalNome: c.profissionalNome,
    status: c.status,
    inicioEm: data(c.inicioEm),
    encerradoEm: dataOuNull(c.encerradoEm),
    temArquivo: !!c.arquivo,
    pendencias: pendencias(c),
    criadoEm: c.criadoEm.toISOString(),
  };
}

export function paraContratoDetalhe(
  c: ContratoComArquivo,
  servicos: { id: string; nome: string }[],
  salaoNome: string,
): ContratoDetalhe {
  return {
    id: c.id,
    status: c.status,
    profissionalId: c.profissionalId,
    salaoRazaoSocial: c.salaoRazaoSocial,
    salaoDocumento: c.salaoDocumento,
    salaoEndereco: c.salaoEndereco,
    profissionalNome: c.profissionalNome,
    profissionalDocumento: c.profissionalDocumento,
    profissionalMei: c.profissionalMei,
    profissionalEndereco: c.profissionalEndereco,
    funcoes: c.funcoes as FuncaoParceiro[],
    servicoIds: c.servicoIds,
    servicos,
    cotaProfissionalBps: c.cotaProfissionalBps,
    periodicidade: c.periodicidade,
    inicioEm: data(c.inicioEm),
    assinadoEm: dataOuNull(c.assinadoEm),
    homologacao: c.homologacao,
    homologadoEm: dataOuNull(c.homologadoEm),
    testemunhas: testemunhasDe(c),
    temArquivo: !!c.arquivo,
    arquivoNome: c.arquivo?.nome ?? null,
    avisoPrevioEm: dataOuNull(c.avisoPrevioEm),
    encerradoEm: dataOuNull(c.encerradoEm),
    comumAcordo: c.comumAcordo,
    motivoEncerramento: c.motivoEncerramento,
    pendencias: pendencias(c),
    salaoNome,
    criadoEm: c.criadoEm.toISOString(),
  };
}
