export interface Vinculo {
  profissionalId: string;
  nome: string;
  precoCentavos: number | null;
  duracaoMin: number | null;
}

/**
 * Quem pode fazer o serviço. Sem nenhum profissional marcado, o serviço é "do
 * salão": qualquer profissional ativo faz, com o preço e a duração do serviço.
 * Com marcados, só eles (os ativos).
 *
 * @param totalMarcados vínculos do serviço, inclusive de profissionais desativados
 * @param marcadosAtivos vínculos com profissionais ativos (já filtrados)
 * @param ativosDoSalao profissionais ativos do salão
 */
export function quemFazOServico(
  totalMarcados: number,
  marcadosAtivos: Vinculo[],
  ativosDoSalao: { id: string; nome: string }[],
): Vinculo[] {
  if (totalMarcados > 0) return marcadosAtivos;
  return ativosDoSalao.map((p) => ({
    profissionalId: p.id,
    nome: p.nome,
    precoCentavos: null,
    duracaoMin: null,
  }));
}
