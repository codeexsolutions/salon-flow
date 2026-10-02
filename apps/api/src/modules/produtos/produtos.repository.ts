import { Injectable } from '@nestjs/common';
import type {
  AtualizarProdutoInput,
  CriarProdutoInput,
  DefinirFichaTecnicaInput,
  MovimentarEstoqueInput,
} from '@salonflow/shared';
import { PrismaService } from '../../shared/database/prisma.service.js';

const custoProduto = {
  select: {
    nome: true,
    unidade: true,
    tamanhoEmbalagem: true,
    custoEmbalagemCentavos: true,
  },
} as const;

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class ProdutosRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(salaoId: string, incluirInativos: boolean) {
    return this.prisma.produto.findMany({
      where: { salaoId, ...(incluirInativos ? {} : { ativo: true }) },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });
  }

  buscar(salaoId: string, id: string) {
    return this.prisma.produto.findFirst({ where: { id, salaoId } });
  }

  buscarVarios(salaoId: string, ids: string[]) {
    return this.prisma.produto.findMany({ where: { salaoId, id: { in: ids } } });
  }

  async nomeEmUso(salaoId: string, nome: string, ignorarId?: string) {
    const total = await this.prisma.produto.count({
      where: {
        salaoId,
        nome: { equals: nome, mode: 'insensitive' },
        ...(ignorarId && { id: { not: ignorarId } }),
      },
    });
    return total > 0;
  }

  criar(salaoId: string, dados: CriarProdutoInput) {
    return this.prisma.produto.create({ data: { ...dados, salaoId } });
  }

  atualizar(salaoId: string, id: string, dados: AtualizarProdutoInput) {
    return this.prisma.produto.update({ where: { id, salaoId }, data: dados });
  }

  /** Lança o movimento e atualiza o saldo na mesma transação. */
  movimentar(salaoId: string, id: string, dados: MovimentarEstoqueInput, criadoPorId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.movimentoEstoque.create({
        data: { ...dados, salaoId, produtoId: id, criadoPorId },
      });
      return tx.produto.update({
        where: { id, salaoId },
        data: { estoqueAtual: { increment: dados.quantidade } },
      });
    });
  }

  movimentos(salaoId: string, produtoId: string, limite: number) {
    return this.prisma.movimentoEstoque.findMany({
      where: { salaoId, produtoId },
      include: { comandaItem: { select: { comanda: { select: { numero: true } } } } },
      orderBy: { criadoEm: 'desc' },
      take: limite,
    });
  }

  fichaDosServicos(salaoId: string, servicoIds: string[]) {
    return this.prisma.fichaTecnicaItem.findMany({
      where: { salaoId, servicoId: { in: servicoIds } },
      include: { produto: custoProduto },
      orderBy: { produto: { nome: 'asc' } },
    });
  }

  substituirFicha(salaoId: string, servicoId: string, { itens }: DefinirFichaTecnicaInput) {
    return this.prisma.$transaction([
      this.prisma.fichaTecnicaItem.deleteMany({ where: { salaoId, servicoId } }),
      this.prisma.fichaTecnicaItem.createMany({
        data: itens.map((i) => ({ ...i, salaoId, servicoId })),
      }),
    ]);
  }
}
