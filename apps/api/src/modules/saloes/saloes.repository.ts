import { Injectable } from '@nestjs/common';
import type { AtualizarSalaoInput, CriarSalaoInput } from '@salonflow/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

/** Camada de INFRAESTRUTURA: único lugar do módulo que conhece o Prisma. */
@Injectable()
export class SaloesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async slugExiste(slug: string): Promise<boolean> {
    const total = await this.prisma.salao.count({ where: { slug } });
    return total > 0;
  }

  buscarPorId(id: string) {
    return this.prisma.salao.findUnique({ where: { id } });
  }

  /** Diretório: salões ativos e visíveis, filtrados por texto, cidade e categoria de serviço. */
  buscarMarketplace(
    filtros: { busca?: string; cidade?: string; categoria?: string },
    pagina: number,
    porPagina: number,
  ) {
    const insensivel = (v: string) => ({ equals: v, mode: 'insensitive' as const });
    const contem = (v: string) => ({ contains: v, mode: 'insensitive' as const });
    const where: Prisma.SalaoWhereInput = {
      ativo: true,
      visivelNoMarketplace: true,
      ...(filtros.busca && {
        OR: [{ nome: contem(filtros.busca) }, { cidade: contem(filtros.busca) }, { bairro: contem(filtros.busca) }],
      }),
      ...(filtros.cidade && { cidade: insensivel(filtros.cidade) }),
      ...(filtros.categoria && {
        servicos: { some: { ativo: true, visivelOnline: true, categoria: insensivel(filtros.categoria) } },
      }),
    };
    return this.prisma.$transaction([
      this.prisma.salao.count({ where }),
      this.prisma.salao.findMany({
        where,
        include: {
          _count: { select: { servicos: { where: { ativo: true, visivelOnline: true } } } },
        },
        orderBy: { nome: 'asc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
    ]);
  }

  /** Cidades e categorias de serviço existentes em salões visíveis (opções de filtro). */
  async filtrosMarketplace() {
    const visivel = { ativo: true, visivelNoMarketplace: true };
    const [cidades, categorias] = await Promise.all([
      this.prisma.salao.groupBy({
        by: ['cidade', 'uf'],
        where: { ...visivel, cidade: { not: null } },
        _count: { _all: true },
        orderBy: { cidade: 'asc' },
      }),
      this.prisma.servico.findMany({
        where: { ativo: true, visivelOnline: true, categoria: { not: null }, salao: visivel },
        distinct: ['categoria'],
        select: { categoria: true },
        orderBy: { categoria: 'asc' },
      }),
    ]);
    return {
      cidades: cidades.map((c) => ({ cidade: c.cidade!, uf: c.uf, total: c._count._all })),
      categorias: categorias.map((c) => c.categoria!),
    };
  }

  buscarAtivoPorSlug(slug: string) {
    return this.prisma.salao.findFirst({ where: { slug, ativo: true } });
  }

  /** Cria o salão e já vincula o criador como DONO, na mesma transação. */
  criarComDono(dados: CriarSalaoInput, donoId: string) {
    return this.prisma.salao.create({
      data: {
        ...dados,
        membros: { create: { usuarioId: donoId, papel: 'DONO' } },
      },
    });
  }

  atualizar(id: string, dados: AtualizarSalaoInput) {
    return this.prisma.salao.update({ where: { id }, data: dados });
  }
}
