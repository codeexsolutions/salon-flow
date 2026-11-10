import { Injectable } from '@nestjs/common';
import type {
  AnotacaoClienteInput,
  AtualizarClienteInput,
  CriarClienteInput,
} from '@salonflow/shared';
import { PrismaService } from '../../shared/database/prisma.service.js';

/** Data AAAA-MM-DD -> Date (coluna DATE, meia-noite UTC). */
const paraData = (d: string) => new Date(`${d}T00:00:00Z`);

export interface TotaisBrutos {
  totalCentavos: number;
  visitas: number;
  primeira: Date | null;
  ultima: Date | null;
  faltas: number;
  cancelamentos: number;
}

const INCLUDE_ANOTACAO = {
  servico: { select: { id: true, nome: true } },
  profissional: { select: { id: true, nome: true } },
} as const;

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class ClientesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Busca por nome, telefone ou e-mail (sem diferenciar maiúsculas). */
  buscar(salaoId: string, termo: string, limite: number) {
    const contem = { contains: termo, mode: 'insensitive' as const };
    return this.prisma.cliente.findMany({
      where: {
        salaoId,
        ...(termo && { OR: [{ nome: contem }, { telefone: contem }, { email: contem }] }),
      },
      orderBy: { nome: 'asc' },
      take: limite,
    });
  }

  buscarPorId(salaoId: string, id: string) {
    return this.prisma.cliente.findFirst({ where: { id, salaoId } });
  }

  criar(salaoId: string, { nascimento, ...dados }: CriarClienteInput) {
    return this.prisma.cliente.create({
      data: { ...dados, salaoId, ...(nascimento && { nascimento: paraData(nascimento) }) },
    });
  }

  atualizar(salaoId: string, id: string, { nascimento, ...dados }: AtualizarClienteInput) {
    return this.prisma.cliente.update({
      where: { id, salaoId },
      data: { ...dados, nascimento: nascimento ? paraData(nascimento) : null },
    });
  }

  todos(salaoId: string) {
    return this.prisma.cliente.findMany({ where: { salaoId }, orderBy: { nome: 'asc' } });
  }

  /**
   * Totais por cliente: comandas fechadas (gasto, visitas, primeira/última) e
   * agendamentos com falta ou cancelados. `clienteId` limita a um cliente.
   */
  async totais(salaoId: string, clienteId?: string): Promise<Map<string, TotaisBrutos>> {
    const [comandas, agendamentos] = await Promise.all([
      this.prisma.comanda.groupBy({
        by: ['clienteId'],
        where: { salaoId, status: 'FECHADA', clienteId: clienteId ?? { not: null } },
        _sum: { totalCentavos: true },
        _count: { _all: true },
        _min: { fechadaEm: true },
        _max: { fechadaEm: true },
      }),
      this.prisma.agendamento.groupBy({
        by: ['clienteId', 'status'],
        where: {
          salaoId,
          status: { in: ['FALTOU', 'CANCELADO'] },
          ...(clienteId && { clienteId }),
        },
        _count: { _all: true },
      }),
    ]);

    const mapa = new Map<string, TotaisBrutos>();
    const de = (id: string) => {
      let t = mapa.get(id);
      if (!t) {
        t = {
          totalCentavos: 0,
          visitas: 0,
          primeira: null,
          ultima: null,
          faltas: 0,
          cancelamentos: 0,
        };
        mapa.set(id, t);
      }
      return t;
    };
    for (const c of comandas) {
      if (!c.clienteId) continue;
      const t = de(c.clienteId);
      t.totalCentavos = c._sum.totalCentavos ?? 0;
      t.visitas = c._count._all;
      t.primeira = c._min.fechadaEm;
      t.ultima = c._max.fechadaEm;
    }
    for (const a of agendamentos) {
      const t = de(a.clienteId);
      if (a.status === 'FALTOU') t.faltas = a._count._all;
      else t.cancelamentos = a._count._all;
    }
    return mapa;
  }

  /** Atendimentos (comandas fechadas) do cliente, do mais recente ao mais antigo. */
  atendimentos(salaoId: string, clienteId: string, limite: number) {
    return this.prisma.comanda.findMany({
      where: { salaoId, clienteId, status: 'FECHADA' },
      orderBy: { fechadaEm: 'desc' },
      take: limite,
      select: {
        id: true,
        numero: true,
        fechadaEm: true,
        totalCentavos: true,
        itens: {
          select: {
            descricao: true,
            quantidade: true,
            valorCentavos: true,
            tipo: true,
            profissional: { select: { nome: true } },
          },
        },
      },
    });
  }

  proximosAgendamentos(salaoId: string, clienteId: string, aPartirDe: Date) {
    return this.prisma.agendamento.findMany({
      where: {
        salaoId,
        clienteId,
        inicio: { gte: aPartirDe },
        status: { in: ['AGENDADO', 'CONFIRMADO'] },
      },
      orderBy: { inicio: 'asc' },
      take: 10,
      select: {
        id: true,
        inicio: true,
        servico: { select: { nome: true } },
        profissional: { select: { nome: true } },
      },
    });
  }

  // ---- Ficha técnica (anotações) ----

  anotacoes(salaoId: string, clienteId: string, limite?: number) {
    return this.prisma.anotacaoCliente.findMany({
      where: { salaoId, clienteId },
      orderBy: [{ data: 'desc' }, { criadoEm: 'desc' }],
      take: limite,
      include: INCLUDE_ANOTACAO,
    });
  }

  anotacao(salaoId: string, id: string) {
    return this.prisma.anotacaoCliente.findFirst({ where: { id, salaoId } });
  }

  criarAnotacao(
    salaoId: string,
    clienteId: string,
    autorId: string,
    { data, ...dados }: AnotacaoClienteInput,
  ) {
    return this.prisma.anotacaoCliente.create({
      data: {
        salaoId,
        clienteId,
        autorId,
        texto: dados.texto,
        servicoId: dados.servicoId ?? null,
        profissionalId: dados.profissionalId ?? null,
        data: paraData(data),
      },
      include: INCLUDE_ANOTACAO,
    });
  }

  atualizarAnotacao(salaoId: string, id: string, { data, ...dados }: AnotacaoClienteInput) {
    return this.prisma.anotacaoCliente.update({
      where: { id, salaoId },
      data: {
        texto: dados.texto,
        servicoId: dados.servicoId ?? null,
        profissionalId: dados.profissionalId ?? null,
        data: paraData(data),
      },
      include: INCLUDE_ANOTACAO,
    });
  }

  excluirAnotacao(salaoId: string, id: string) {
    return this.prisma.anotacaoCliente.delete({ where: { id, salaoId } });
  }

  /** Serviço e profissional informados são deste salão? */
  async referenciasValidas(
    salaoId: string,
    servicoId?: string | null,
    profissionalId?: string | null,
  ) {
    const [servicos, profissionais] = await Promise.all([
      servicoId ? this.prisma.servico.count({ where: { id: servicoId, salaoId } }) : 1,
      profissionalId
        ? this.prisma.profissional.count({ where: { id: profissionalId, salaoId } })
        : 1,
    ]);
    return servicos > 0 && profissionais > 0;
  }

  servicosAtivos(salaoId: string) {
    return this.prisma.servico.findMany({
      where: { salaoId, ativo: true },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    });
  }

  /** O profissional já atendeu (ou tem horário com) este cliente? */
  async profissionalAtende(salaoId: string, profissionalId: string, clienteId: string) {
    const [agendamentos, itens] = await Promise.all([
      this.prisma.agendamento.count({ where: { salaoId, clienteId, profissionalId } }),
      this.prisma.comandaItem.count({ where: { salaoId, profissionalId, comanda: { clienteId } } }),
    ]);
    return agendamentos + itens > 0;
  }

  /**
   * Ficha do usuário do app neste salão: a já vinculada; senão, uma ficha criada pela
   * recepção com o mesmo e-mail (passa a ser dele); senão, uma nova.
   */
  garantirParaUsuario(salaoId: string, usuario: { id: string; email: string; nome: string }) {
    return this.prisma.$transaction(async (tx) => {
      // Cadastro do cliente no app: os campos preenchidos valem para todos os salões.
      const perfil = await tx.perfilCliente.findUnique({ where: { usuarioId: usuario.id } });
      const doPerfil = Object.fromEntries(
        Object.entries({
          nome: perfil?.nome,
          telefone: perfil?.telefone,
          email: perfil?.email,
          nascimento: perfil?.nascimento,
        }).filter(([, v]) => v != null),
      );

      const vinculada = await tx.cliente.findUnique({
        where: { salaoId_usuarioId: { salaoId, usuarioId: usuario.id } },
      });
      if (vinculada) return vinculada;

      const mesmoEmail = await tx.cliente.findFirst({
        where: { salaoId, usuarioId: null, email: { equals: usuario.email, mode: 'insensitive' } },
        orderBy: { criadoEm: 'asc' },
      });
      if (mesmoEmail) {
        return tx.cliente.update({
          where: { id: mesmoEmail.id },
          data: { usuarioId: usuario.id, ...doPerfil },
        });
      }

      return tx.cliente.create({
        data: {
          salaoId,
          usuarioId: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          ...doPerfil,
        },
      });
    });
  }
}
