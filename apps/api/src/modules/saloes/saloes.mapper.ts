import type { SalaoPublico } from '@salonflow/shared';
import type { Salao } from '../../generated/prisma/client.js';

/** Define o que de um salão pode ser exposto publicamente (marketplace). */
export function paraSalaoPublico(salao: Salao): SalaoPublico {
  return {
    id: salao.id,
    nome: salao.nome,
    slug: salao.slug,
    cidade: salao.cidade,
    uf: salao.uf,
    telefone: salao.telefone,
    fusoHorario: salao.fusoHorario,
  };
}
