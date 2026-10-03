import { usuarioDeLogin } from '@salonflow/shared';
import type {
  AcessoApp,
  BloqueioAgenda as BloqueioAgendaDto,
  ProfissionalDetalhe,
  ProfissionalResumo,
} from '@salonflow/shared';
import type {
  BloqueioAgenda,
  JornadaIntervalo,
  Profissional,
} from '../../generated/prisma/client.js';
import { paraIntervaloJornada } from './domain/jornada.js';

function acessoApp(p: Profissional): AcessoApp {
  if (p.usuarioId) return 'ATIVO';
  return p.email ? 'PENDENTE' : 'SEM_ACESSO';
}

export function paraProfissionalResumo(p: Profissional): ProfissionalResumo {
  return {
    id: p.id,
    nome: p.nome,
    usuario: p.email && usuarioDeLogin(p.email),
    telefone: p.telefone,
    corAgenda: p.corAgenda,
    ativo: p.ativo,
    acessoApp: acessoApp(p),
  };
}

export function paraProfissionalDetalhe(
  p: Profissional & { jornada: JornadaIntervalo[] },
): ProfissionalDetalhe {
  return { ...paraProfissionalResumo(p), jornada: p.jornada.map(paraIntervaloJornada) };
}

export function paraBloqueio(b: BloqueioAgenda): BloqueioAgendaDto {
  return {
    id: b.id,
    inicio: b.inicio.toISOString(),
    fim: b.fim.toISOString(),
    motivo: b.motivo,
  };
}
