export interface ValoresServico {
  precoCentavos: number;
  duracaoMin: number;
}

export interface ValoresProprios {
  precoCentavos: number | null;
  duracaoMin: number | null;
}

/**
 * Preço e duração que valem quando um profissional específico faz o serviço:
 * os próprios dele, se definidos; senão, os do serviço.
 * Usado pela agenda (encaixe de horários) e pelas comandas (valor cobrado).
 */
export function valoresDoProfissional(
  servico: ValoresServico,
  proprios: ValoresProprios,
): ValoresServico {
  return {
    precoCentavos: proprios.precoCentavos ?? servico.precoCentavos,
    duracaoMin: proprios.duracaoMin ?? servico.duracaoMin,
  };
}
