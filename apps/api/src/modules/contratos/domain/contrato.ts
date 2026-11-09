import { AVISO_PREVIO_DIAS, type Testemunha } from '@salonflow/shared';
import { RegraDeNegocioError } from '../../../shared/errors/domain.error.js';

const DIA_MS = 24 * 3600_000;
const diasEntre = (de: string, ate: string) =>
  Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / DIA_MS);

/**
 * O que falta para o contrato valer (Lei 12.592, art. 1º-A, § 8º): assinado,
 * homologado (sindicato ou MTE) e com duas testemunhas.
 */
export function pendenciasParaAtivar(c: {
  assinadoEm: string | null;
  homologacao: string | null;
  homologadoEm: string | null;
  testemunhas: Testemunha[];
}): string[] {
  const pendencias: string[] = [];
  if (!c.assinadoEm) pendencias.push('Informe a data da assinatura');
  if (!c.homologacao || !c.homologadoEm) {
    pendencias.push('Informe a homologação (sindicato ou Ministério do Trabalho) e a data');
  }
  if (c.testemunhas.length < 2) pendencias.push('Informe as duas testemunhas');
  return pendencias;
}

/** Rescisão unilateral exige aviso prévio mínimo de 30 dias (§ 10, V). */
export function validarEncerramento(dados: {
  inicioEm: string;
  avisoPrevioEm: string;
  encerradoEm: string;
  comumAcordo: boolean;
}) {
  if (dados.encerradoEm < dados.inicioEm) {
    throw new RegraDeNegocioError(
      'ENCERRAMENTO_INVALIDO',
      'A data de encerramento é antes do início do contrato.',
    );
  }
  if (dados.encerradoEm < dados.avisoPrevioEm) {
    throw new RegraDeNegocioError(
      'ENCERRAMENTO_INVALIDO',
      'A data de encerramento é antes do aviso prévio.',
    );
  }
  if (!dados.comumAcordo && diasEntre(dados.avisoPrevioEm, dados.encerradoEm) < AVISO_PREVIO_DIAS) {
    throw new RegraDeNegocioError(
      'AVISO_PREVIO_CURTO',
      `Sem comum acordo, o encerramento precisa de no mínimo ${AVISO_PREVIO_DIAS} dias de aviso prévio.`,
    );
  }
}
