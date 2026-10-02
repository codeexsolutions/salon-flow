import { Injectable } from '@nestjs/common';
import type {
  ConfiguracaoComissao,
  DefinirRegrasComissaoInput,
  ExtratoComissoes,
  ExtratoProfissional,
} from '@salonflow/shared';
import { limitesDoDia, proximoDia } from '../../shared/domain/data-hora.js';
import { RegraDeNegocioError } from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { ProfissionaisService } from '../profissionais/profissionais.service.js';
import { ServicosService } from '../servicos/servicos.service.js';
import { ComissoesRepository } from './comissoes.repository.js';

const MAX_DIAS_EXTRATO = 366;

@Injectable()
export class ComissoesService {
  constructor(
    private readonly repository: ComissoesRepository,
    private readonly profissionais: ProfissionaisService,
    private readonly servicos: ServicosService,
    private readonly contexto: ContextoSalao,
  ) {}

  async configuracao(): Promise<ConfiguracaoComissao> {
    return this.repository.configuracao(this.contexto.salaoId);
  }

  async salvarConfiguracao(dados: ConfiguracaoComissao) {
    await this.repository.salvarConfiguracao(this.contexto.salaoId, dados);
    return this.configuracao();
  }

  regras() {
    return this.repository.regras(this.contexto.salaoId);
  }

  async definirRegras(dados: DefinirRegrasComissaoInput) {
    const profissionalIds = [
      ...new Set(dados.regras.map((r) => r.profissionalId).filter((id): id is string => !!id)),
    ];
    const servicoIds = [
      ...new Set(dados.regras.map((r) => r.servicoId).filter((id): id is string => !!id)),
    ];
    const [profsValidos, servicosValidos] = await Promise.all([
      this.profissionais.contarAtivos(profissionalIds),
      this.servicos.contarDoSalao(servicoIds),
    ]);
    if (profsValidos !== profissionalIds.length || servicosValidos !== servicoIds.length) {
      throw new RegraDeNegocioError(
        'REGRA_INVALIDA',
        'Há regras com profissional ou serviço que não pertence a este salão.',
      );
    }
    await this.repository.substituirRegras(this.contexto.salaoId, dados);
    return this.regras();
  }

  /** Tudo que o fechamento da comanda precisa para calcular as comissões. */
  async parametrosDeCalculo() {
    const [config, regras] = await Promise.all([this.configuracao(), this.regras()]);
    return {
      padraoBps: config.comissaoPadraoBps,
      sobreLiquido: config.comissaoSobreLiquido,
      taxas: Object.fromEntries(config.taxas.map((t) => [t.forma, t.taxaBps])),
      regras,
    };
  }

  /** Extrato por profissional das comandas fechadas entre as datas locais (inclusivas). */
  async extrato(de: string, ate: string, profissionalId?: string): Promise<ExtratoComissoes> {
    if (ate < de)
      throw new RegraDeNegocioError('PERIODO_INVALIDO', 'A data final é antes da inicial.');
    const fuso = this.contexto.fusoHorario;
    const inicio = limitesDoDia(de, fuso).inicio;
    const fim = limitesDoDia(proximoDia(ate), fuso).inicio;
    if (fim.getTime() - inicio.getTime() > MAX_DIAS_EXTRATO * 24 * 3600_000) {
      throw new RegraDeNegocioError('PERIODO_INVALIDO', 'O período máximo é de 1 ano.');
    }

    const itens = await this.repository.itensDoPeriodo(
      this.contexto.salaoId,
      inicio,
      fim,
      profissionalId,
    );

    const porProfissional = new Map<string, ExtratoProfissional>();
    for (const item of itens) {
      const grupo = porProfissional.get(item.profissionalId) ?? {
        profissionalId: item.profissionalId,
        nome: item.profissional.nome,
        quantidade: 0,
        totalServicosCentavos: 0,
        totalComissaoCentavos: 0,
        itens: [],
      };
      grupo.quantidade += 1;
      grupo.totalServicosCentavos += item.valorCentavos;
      grupo.totalComissaoCentavos += item.comissaoCentavos ?? 0;
      grupo.itens.push({
        itemId: item.id,
        comandaNumero: item.comanda.numero,
        fechadaEm: item.comanda.fechadaEm!.toISOString(),
        descricao: item.descricao,
        cliente: item.comanda.cliente?.nome ?? null,
        valorCentavos: item.valorCentavos,
        baseComissaoCentavos: item.baseComissaoCentavos ?? 0,
        comissaoBps: item.comissaoBps ?? 0,
        comissaoCentavos: item.comissaoCentavos ?? 0,
      });
      porProfissional.set(item.profissionalId, grupo);
    }

    const profissionais = [...porProfissional.values()].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR'),
    );
    return {
      de,
      ate,
      profissionais,
      totalServicosCentavos: profissionais.reduce((s, p) => s + p.totalServicosCentavos, 0),
      totalComissaoCentavos: profissionais.reduce((s, p) => s + p.totalComissaoCentavos, 0),
    };
  }

  /** Extrato do profissional logado (app do profissional). */
  async extratoDoUsuario(usuarioId: string, de: string, ate: string) {
    const profissional = await this.profissionais.doUsuario(usuarioId);
    return this.extrato(de, ate, profissional.id);
  }
}
