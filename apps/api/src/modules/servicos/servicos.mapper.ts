import type { ServicoDetalhe, ServicoResumo } from '@salonflow/shared';
import type { Servico, ServicoProfissional } from '../../generated/prisma/client.js';

type ServicoComContagem = Servico & { _count: { profissionais: number } };

type ServicoComProfissionais = ServicoComContagem & {
  profissionais: (ServicoProfissional & {
    profissional: { nome: string; corAgenda: string; ativo: boolean };
  })[];
};

export function paraServicoResumo(s: ServicoComContagem): ServicoResumo {
  return {
    id: s.id,
    nome: s.nome,
    descricao: s.descricao,
    categoria: s.categoria,
    precoCentavos: s.precoCentavos,
    duracaoMin: s.duracaoMin,
    visivelOnline: s.visivelOnline,
    ativo: s.ativo,
    totalProfissionais: s._count.profissionais,
  };
}

export function paraServicoDetalhe(s: ServicoComProfissionais): ServicoDetalhe {
  return {
    ...paraServicoResumo(s),
    profissionais: s.profissionais.map((sp) => ({
      profissionalId: sp.profissionalId,
      nome: sp.profissional.nome,
      corAgenda: sp.profissional.corAgenda,
      ativo: sp.profissional.ativo,
      precoCentavos: sp.precoCentavos,
      duracaoMin: sp.duracaoMin,
    })),
  };
}
