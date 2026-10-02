import type { SalaoConfiguracao, SalaoPublico } from '@salonflow/shared';
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
    endereco: salao.endereco,
    bairro: salao.bairro,
    descricao: salao.descricao,
    instagram: salao.instagram,
    logoUrl: salao.logoUrl,
    capaUrl: salao.capaUrl,
  };
}

export function paraSalaoConfiguracao(salao: Salao): SalaoConfiguracao {
  return { ...paraSalaoPublico(salao), visivelNoMarketplace: salao.visivelNoMarketplace };
}
