import type { ServicoResumo } from '@salonflow/shared';

/** Categorias distintas já usadas, em ordem alfabética (sugestões do formulário). */
export function categoriasDe(servicos: ServicoResumo[]): string[] {
  return [...new Set(servicos.map((s) => s.categoria).filter((c): c is string => !!c))].sort(
    (a, b) => a.localeCompare(b, 'pt-BR'),
  );
}
