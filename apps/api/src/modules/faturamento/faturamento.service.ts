import { Injectable } from '@nestjs/common';
import type { RelatorioFaturamento } from '@salonflow/shared';
import { limitesDoDia, proximoDia } from '../../shared/domain/data-hora.js';
import { RegraDeNegocioError } from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import {
  diasDoPeriodo,
  periodoAnterior,
  porDia,
  porForma,
  porProfissional,
  ranking,
  resumoMovimentos,
  totaisDe,
} from './domain/relatorio.js';
import { FaturamentoRepository } from './faturamento.repository.js';

const MAX_DIAS = 366;

@Injectable()
export class FaturamentoService {
  constructor(
    private readonly repository: FaturamentoRepository,
    private readonly contexto: ContextoSalao,
  ) {}

  /** Faturamento das comandas fechadas entre as datas locais (inclusivas). */
  async relatorio(de: string, ate: string): Promise<RelatorioFaturamento> {
    if (ate < de)
      throw new RegraDeNegocioError('PERIODO_INVALIDO', 'A data final é antes da inicial.');
    if (diasDoPeriodo(de, ate) > MAX_DIAS)
      throw new RegraDeNegocioError('PERIODO_INVALIDO', 'O período máximo é de 1 ano.');

    const anterior = periodoAnterior(de, ate);
    const fuso = this.contexto.fusoHorario;
    const [comandas, comandasAnteriores, movimentos] = await Promise.all([
      this.comandas(de, ate),
      this.comandas(anterior.de, anterior.ate),
      this.repository.movimentosDoCaixa(
        this.contexto.salaoId,
        limitesDoDia(de, fuso).inicio,
        limitesDoDia(proximoDia(ate), fuso).inicio,
      ),
    ]);
    const totais = totaisDe(comandas);

    return {
      de,
      ate,
      totais,
      anterior: { ...anterior, totais: totaisDe(comandasAnteriores) },
      porDia: porDia(comandas, de, ate, this.contexto.fusoHorario),
      porForma: porForma(comandas),
      porProfissional: porProfissional(comandas),
      servicos: ranking(comandas, 'SERVICO'),
      produtos: ranking(comandas, 'PRODUTO'),
      movimentos: resumoMovimentos(movimentos, totais.resultadoCentavos, fuso),
    };
  }

  private comandas(de: string, ate: string) {
    const fuso = this.contexto.fusoHorario;
    return this.repository.comandasFechadas(
      this.contexto.salaoId,
      limitesDoDia(de, fuso).inicio,
      limitesDoDia(proximoDia(ate), fuso).inicio,
    );
  }
}
