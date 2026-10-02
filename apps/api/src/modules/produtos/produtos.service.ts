import { Injectable } from '@nestjs/common';
import type {
  AtualizarProdutoInput,
  CriarProdutoInput,
  DefinirFichaTecnicaInput,
  FichaTecnica,
  MovimentarEstoqueInput,
} from '@salonflow/shared';
import {
  ConflitoError,
  NaoEncontradoError,
  RegraDeNegocioError,
} from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { ServicosService } from '../servicos/servicos.service.js';
import { custoDaFicha, custoDeConsumo } from './domain/custo.js';
import { ProdutosRepository } from './produtos.repository.js';

/** Saída de estoque a registrar no fechamento da comanda. */
export interface SaidaEstoque {
  produtoId: string;
  quantidade: number;
  tipo: 'CONSUMO' | 'VENDA';
  comandaItemId: string;
}

@Injectable()
export class ProdutosService {
  constructor(
    private readonly repository: ProdutosRepository,
    private readonly servicos: ServicosService,
    private readonly contexto: ContextoSalao,
  ) {}

  listar(incluirInativos: boolean) {
    return this.repository.listar(this.contexto.salaoId, incluirInativos);
  }

  async buscar(id: string) {
    const produto = await this.repository.buscar(this.contexto.salaoId, id);
    if (!produto) throw new NaoEncontradoError('Produto');
    return produto;
  }

  async criar(dados: CriarProdutoInput) {
    if (await this.repository.nomeEmUso(this.contexto.salaoId, dados.nome)) {
      throw this.nomeDuplicado();
    }
    return this.repository.criar(this.contexto.salaoId, dados);
  }

  async atualizar(id: string, dados: AtualizarProdutoInput) {
    await this.buscar(id);
    if (dados.nome && (await this.repository.nomeEmUso(this.contexto.salaoId, dados.nome, id))) {
      throw this.nomeDuplicado();
    }
    return this.repository.atualizar(this.contexto.salaoId, id, dados);
  }

  async movimentar(id: string, dados: MovimentarEstoqueInput, usuarioId: string) {
    await this.buscar(id);
    return this.repository.movimentar(this.contexto.salaoId, id, dados, usuarioId);
  }

  async movimentos(id: string) {
    await this.buscar(id);
    return this.repository.movimentos(this.contexto.salaoId, id, 100);
  }

  /** Ficha técnica de um serviço, com o custo pelo preço atual das embalagens. */
  async fichaTecnica(servicoId: string): Promise<FichaTecnica> {
    await this.servicos.buscar(servicoId);
    const itens = await this.repository.fichaDosServicos(this.contexto.salaoId, [servicoId]);
    return {
      servicoId,
      itens: itens.map((i) => ({
        produtoId: i.produtoId,
        nome: i.produto.nome,
        unidade: i.produto.unidade,
        quantidade: i.quantidade,
        custoCentavos: custoDeConsumo(i.quantidade, i.produto),
      })),
      custoTotalCentavos: custoDaFicha(itens),
    };
  }

  async definirFichaTecnica(servicoId: string, dados: DefinirFichaTecnicaInput) {
    await this.servicos.buscar(servicoId);
    const ids = dados.itens.map((i) => i.produtoId);
    const produtos = await this.repository.buscarVarios(this.contexto.salaoId, ids);
    if (produtos.length !== ids.length || produtos.some((p) => !p.ativo)) {
      throw new RegraDeNegocioError(
        'PRODUTO_INVALIDO',
        'Há produtos que não existem neste salão ou estão desativados.',
      );
    }
    await this.repository.substituirFicha(this.contexto.salaoId, servicoId, dados);
    return this.fichaTecnica(servicoId);
  }

  /**
   * Para o fechamento da comanda: custo da ficha técnica de cada item de serviço e
   * as saídas de estoque (consumo dos serviços + produtos vendidos).
   */
  async consumoDaComanda(
    itens: {
      id: string;
      tipo: 'SERVICO' | 'PRODUTO';
      servicoId: string | null;
      produtoId: string | null;
      quantidade: number;
    }[],
  ) {
    const servicoIds = [...new Set(itens.map((i) => i.servicoId).filter((x): x is string => !!x))];
    const produtoIds = [...new Set(itens.map((i) => i.produtoId).filter((x): x is string => !!x))];
    const [fichas, vendidos] = await Promise.all([
      servicoIds.length ? this.repository.fichaDosServicos(this.contexto.salaoId, servicoIds) : [],
      produtoIds.length ? this.repository.buscarVarios(this.contexto.salaoId, produtoIds) : [],
    ]);

    const custoPorItem = new Map<string, number>();
    const saidas: SaidaEstoque[] = [];

    for (const item of itens) {
      if (item.tipo === 'SERVICO' && item.servicoId) {
        const ficha = fichas.filter((f) => f.servicoId === item.servicoId);
        custoPorItem.set(item.id, custoDaFicha(ficha));
        for (const f of ficha) {
          saidas.push({
            produtoId: f.produtoId,
            quantidade: f.quantidade,
            tipo: 'CONSUMO',
            comandaItemId: item.id,
          });
        }
      } else if (item.tipo === 'PRODUTO' && item.produtoId) {
        const produto = vendidos.find((p) => p.id === item.produtoId);
        custoPorItem.set(item.id, 0);
        if (produto) {
          saidas.push({
            produtoId: produto.id,
            quantidade: item.quantidade * produto.tamanhoEmbalagem,
            tipo: 'VENDA',
            comandaItemId: item.id,
          });
        }
      }
    }
    return { custoPorItem, saidas };
  }

  private nomeDuplicado() {
    return new ConflitoError('NOME_EM_USO', 'Já existe um produto com este nome.');
  }
}
