import type { AgendamentoAgenda } from '@salonflow/shared';
import type { Agendamento } from '../../generated/prisma/client.js';

type AgendamentoComDetalhes = Agendamento & {
  cliente: { id: string; nome: string; telefone: string | null };
  servico: { id: string; nome: string };
};

export function paraAgendamentoAgenda(a: AgendamentoComDetalhes): AgendamentoAgenda {
  return {
    id: a.id,
    inicio: a.inicio.toISOString(),
    fim: a.fim.toISOString(),
    status: a.status,
    origem: a.origem,
    precoCentavos: a.precoCentavos,
    observacoes: a.observacoes,
    profissionalId: a.profissionalId,
    cliente: a.cliente,
    servico: a.servico,
  };
}
