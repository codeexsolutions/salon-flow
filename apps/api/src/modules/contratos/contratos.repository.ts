import { Injectable } from '@nestjs/common';
import type { ContratoInput, EncerrarContratoInput } from '@salonflow/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

const comArquivo = {
  arquivo: { select: { nome: true } },
} satisfies Prisma.ContratoParceriaInclude;

/** "AAAA-MM-DD" <-> coluna DATE. */
export const paraData = (d: string) => new Date(`${d}T00:00:00Z`);
const paraDataOuNull = (d: string | null) => (d ? paraData(d) : null);

function dadosDoContrato(d: Omit<ContratoInput, 'profissionalId'>) {
  return {
    salaoRazaoSocial: d.salaoRazaoSocial,
    salaoDocumento: d.salaoDocumento,
    salaoEndereco: d.salaoEndereco,
    profissionalNome: d.profissionalNome,
    profissionalDocumento: d.profissionalDocumento,
    profissionalMei: d.profissionalMei,
    profissionalEndereco: d.profissionalEndereco,
    funcoes: d.funcoes,
    servicoIds: d.servicoIds,
    cotaProfissionalBps: d.cotaProfissionalBps,
    periodicidade: d.periodicidade,
    inicioEm: paraData(d.inicioEm),
    ...dadosDaFormalizacao(d),
  };
}

function dadosDaFormalizacao(
  d: Pick<ContratoInput, 'assinadoEm' | 'homologacao' | 'homologadoEm' | 'testemunhas'>,
) {
  return {
    assinadoEm: paraDataOuNull(d.assinadoEm),
    homologacao: d.homologacao,
    homologadoEm: paraDataOuNull(d.homologadoEm),
    testemunhas: d.testemunhas,
  };
}

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class ContratosRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(salaoId: string, profissionalId?: string) {
    return this.prisma.contratoParceria.findMany({
      where: { salaoId, ...(profissionalId && { profissionalId }) },
      include: comArquivo,
      orderBy: { criadoEm: 'desc' },
    });
  }

  buscar(salaoId: string, id: string) {
    return this.prisma.contratoParceria.findFirst({ where: { id, salaoId }, include: comArquivo });
  }

  nomesDosServicos(salaoId: string, ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.prisma.servico.findMany({
      where: { salaoId, id: { in: ids } },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    });
  }

  /** Para sugerir um contrato novo. */
  async dadosParaSugestao(salaoId: string, profissionalId: string) {
    const [salao, profissional, ultimo] = await Promise.all([
      this.prisma.salao.findUniqueOrThrow({
        where: { id: salaoId },
        select: { nome: true, endereco: true, bairro: true, cidade: true, uf: true },
      }),
      this.prisma.profissional.findFirst({
        where: { id: profissionalId, salaoId },
        select: { nome: true, servicos: { select: { servicoId: true } } },
      }),
      this.prisma.contratoParceria.findFirst({
        where: { salaoId },
        orderBy: { criadoEm: 'desc' },
        select: {
          salaoRazaoSocial: true,
          salaoDocumento: true,
          salaoEndereco: true,
          periodicidade: true,
        },
      }),
    ]);
    return { salao, profissional, ultimo };
  }

  criar(salaoId: string, dados: ContratoInput) {
    const { profissionalId, ...resto } = dados;
    return this.prisma.contratoParceria.create({
      data: { salaoId, profissionalId, ...dadosDoContrato(resto) },
    });
  }

  /** Rascunho: tudo pode mudar (menos o profissional). */
  async atualizarRascunho(salaoId: string, id: string, dados: ContratoInput) {
    const { profissionalId: _, ...resto } = dados;
    const { count } = await this.prisma.contratoParceria.updateMany({
      where: { id, salaoId, status: 'RASCUNHO' },
      data: dadosDoContrato(resto),
    });
    return count > 0;
  }

  /** Ativo: só a formalização (assinatura, homologação, testemunhas). */
  async atualizarFormalizacao(salaoId: string, id: string, dados: ContratoInput) {
    const { count } = await this.prisma.contratoParceria.updateMany({
      where: { id, salaoId, status: 'ATIVO' },
      data: dadosDaFormalizacao(dados),
    });
    return count > 0;
  }

  /** Ativa se não houver outro contrato ativo do mesmo profissional. */
  ativar(salaoId: string, id: string, profissionalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const outro = await tx.contratoParceria.count({
        where: { salaoId, profissionalId, status: 'ATIVO', id: { not: id } },
      });
      if (outro > 0) return 'OUTRO_ATIVO' as const;
      const { count } = await tx.contratoParceria.updateMany({
        where: { id, salaoId, status: 'RASCUNHO' },
        data: { status: 'ATIVO' },
      });
      return count > 0 ? ('OK' as const) : ('NAO_RASCUNHO' as const);
    });
  }

  async encerrar(salaoId: string, id: string, dados: EncerrarContratoInput) {
    const { count } = await this.prisma.contratoParceria.updateMany({
      where: { id, salaoId, status: 'ATIVO' },
      data: {
        status: 'ENCERRADO',
        avisoPrevioEm: paraData(dados.avisoPrevioEm),
        encerradoEm: paraData(dados.encerradoEm),
        comumAcordo: dados.comumAcordo,
        motivoEncerramento: dados.motivo,
      },
    });
    return count > 0;
  }

  async excluirRascunho(salaoId: string, id: string) {
    const { count } = await this.prisma.contratoParceria.deleteMany({
      where: { id, salaoId, status: 'RASCUNHO' },
    });
    return count > 0;
  }

  salvarArquivo(salaoId: string, contratoId: string, nome: string, conteudo: Buffer) {
    const dados = { nome, tamanho: conteudo.length, conteudo: new Uint8Array(conteudo) };
    return this.prisma.arquivoContrato.upsert({
      where: { contratoId },
      create: { contratoId, salaoId, ...dados },
      update: { ...dados, enviadoEm: new Date() },
    });
  }

  arquivo(salaoId: string, contratoId: string) {
    return this.prisma.arquivoContrato.findFirst({ where: { contratoId, salaoId } });
  }
}
