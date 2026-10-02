import { Injectable } from '@nestjs/common';
import type {
  AbrirCaixaInput,
  CaixaDetalhe,
  FecharCaixaInput,
  MovimentoCaixaInput,
} from '@salonflow/shared';
import type { Caixa, MovimentoCaixa } from '../../generated/prisma/client.js';
import { limitesDoDia, proximoDia } from '../../shared/domain/data-hora.js';
import {
  ConflitoError,
  NaoEncontradoError,
  RegraDeNegocioError,
} from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { CaixaRepository } from './caixa.repository.js';
import { resumoDoCaixa } from './domain/resumo.js';

type CaixaComValores = Caixa & {
  movimentos: MovimentoCaixa[];
  pagamentos: { forma: string; valorCentavos: number }[];
};

@Injectable()
export class CaixaService {
  constructor(
    private readonly repository: CaixaRepository,
    private readonly contexto: ContextoSalao,
  ) {}

  /** Caixa aberto agora (com a conferência parcial) ou null. */
  async atual(): Promise<CaixaDetalhe | null> {
    const caixa = await this.repository.aberto(this.contexto.salaoId);
    return caixa ? paraCaixaDetalhe(caixa) : null;
  }

  /** Usado pelas comandas: os pagamentos entram no caixa aberto, se houver. */
  async idDoCaixaAberto(): Promise<string | null> {
    return (await this.repository.idDoAberto(this.contexto.salaoId))?.id ?? null;
  }

  async abrir({ trocoInicialCentavos }: AbrirCaixaInput, usuarioId: string) {
    const caixa = await this.repository.abrir(
      this.contexto.salaoId,
      trocoInicialCentavos,
      usuarioId,
    );
    if (!caixa) throw new ConflitoError('CAIXA_JA_ABERTO', 'Já existe um caixa aberto.');
    return this.detalhe(caixa.id);
  }

  async movimentar(dados: MovimentoCaixaInput, usuarioId: string) {
    const caixa = await this.exigirAberto();
    if (dados.tipo === 'SANGRIA') {
      const { esperadoDinheiroCentavos } = paraCaixaDetalhe(caixa);
      if (dados.valorCentavos > esperadoDinheiroCentavos) {
        throw new RegraDeNegocioError(
          'SANGRIA_MAIOR_QUE_SALDO',
          'A sangria é maior que o dinheiro esperado na gaveta.',
        );
      }
    }
    await this.repository.registrarMovimento(this.contexto.salaoId, caixa.id, dados, usuarioId);
    return this.detalhe(caixa.id);
  }

  /** Fecha conferindo o dinheiro contado com o esperado. */
  async fechar({ contadoDinheiroCentavos, observacoes }: FecharCaixaInput, usuarioId: string) {
    const caixa = await this.exigirAberto();
    const { esperadoDinheiroCentavos } = paraCaixaDetalhe(caixa);
    const fechou = await this.repository.fechar(this.contexto.salaoId, caixa.id, {
      esperadoDinheiroCentavos,
      contadoDinheiroCentavos,
      diferencaCentavos: contadoDinheiroCentavos - esperadoDinheiroCentavos,
      observacoes,
      fechadoPorId: usuarioId,
    });
    if (!fechou) throw new ConflitoError('CAIXA_JA_FECHADO', 'Este caixa já foi fechado.');
    return this.detalhe(caixa.id);
  }

  async detalhe(id: string): Promise<CaixaDetalhe> {
    const caixa = await this.repository.buscar(this.contexto.salaoId, id);
    if (!caixa) throw new NaoEncontradoError('Caixa');
    return paraCaixaDetalhe(caixa);
  }

  /** Caixas abertos entre as datas locais (inclusivas). */
  async historico(de: string, ate: string) {
    const fuso = this.contexto.fusoHorario;
    const caixas = await this.repository.historico(
      this.contexto.salaoId,
      limitesDoDia(de, fuso).inicio,
      limitesDoDia(proximoDia(ate), fuso).inicio,
    );
    return caixas.map(paraCaixaDetalhe);
  }

  private async exigirAberto() {
    const caixa = await this.repository.aberto(this.contexto.salaoId);
    if (!caixa)
      throw new RegraDeNegocioError('CAIXA_FECHADO', 'Não há caixa aberto. Abra o caixa primeiro.');
    return caixa;
  }
}

function paraCaixaDetalhe(c: CaixaComValores): CaixaDetalhe {
  const resumo = resumoDoCaixa(c.trocoInicialCentavos, c.pagamentos, c.movimentos);
  return {
    id: c.id,
    status: c.status,
    abertoEm: c.abertoEm.toISOString(),
    fechadoEm: c.fechadoEm?.toISOString() ?? null,
    trocoInicialCentavos: c.trocoInicialCentavos,
    totalRecebidoCentavos: resumo.totalRecebidoCentavos,
    // Fechado: vale o que foi gravado no fechamento.
    esperadoDinheiroCentavos: c.esperadoDinheiroCentavos ?? resumo.esperadoDinheiroCentavos,
    contadoDinheiroCentavos: c.contadoDinheiroCentavos,
    diferencaCentavos: c.diferencaCentavos,
    totaisPorForma: resumo.totaisPorForma,
    sangriasCentavos: resumo.sangriasCentavos,
    reforcosCentavos: resumo.reforcosCentavos,
    quantidadePagamentos: c.pagamentos.length,
    observacoes: c.observacoes,
    movimentos: c.movimentos.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      valorCentavos: m.valorCentavos,
      motivo: m.motivo,
      criadoEm: m.criadoEm.toISOString(),
    })),
  };
}
