import { Injectable } from '@nestjs/common';
import type { MaquininhaDto, MaquininhaInput } from '@salonflow/shared';
import type { Maquininha } from '../../generated/prisma/client.js';
import { ConflitoError, NaoEncontradoError } from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { taxaDaMaquininha } from './domain/maquininha.js';
import { MaquininhasRepository } from './maquininhas.repository.js';

@Injectable()
export class MaquininhasService {
  constructor(
    private readonly repository: MaquininhasRepository,
    private readonly contexto: ContextoSalao,
  ) {}

  async listar(): Promise<MaquininhaDto[]> {
    return (await this.repository.listar(this.contexto.salaoId)).map(paraMaquininhaDto);
  }

  async criar(dados: MaquininhaInput) {
    const salaoId = this.contexto.salaoId;
    if (await this.repository.nomeEmUso(salaoId, dados.nome)) throw nomeDuplicado();
    return paraMaquininhaDto(await this.repository.criar(salaoId, dados));
  }

  async atualizar(id: string, dados: MaquininhaInput) {
    const salaoId = this.contexto.salaoId;
    if (await this.repository.nomeEmUso(salaoId, dados.nome, id)) throw nomeDuplicado();
    if (!(await this.repository.atualizar(salaoId, id, dados))) {
      throw new NaoEncontradoError('Maquininha');
    }
  }

  /**
   * Fechamento da comanda: cartão com maquininha usa a taxa da tabela dela
   * (débito ou crédito pelas parcelas). Sem maquininha, vale a taxa da forma.
   */
  async aplicarTaxas<P extends { forma: string; maquininhaId?: string; parcelas?: number }>(
    pagamentos: P[],
  ) {
    const cartao = (p: P) => p.forma === 'DEBITO' || p.forma === 'CREDITO';
    const ids = [
      ...new Set(pagamentos.filter((p) => cartao(p) && p.maquininhaId).map((p) => p.maquininhaId!)),
    ];
    const maquininhas = ids.length
      ? new Map(
          (await this.repository.buscarVarias(this.contexto.salaoId, ids)).map((m) => [m.id, m]),
        )
      : new Map<string, Maquininha>();

    return pagamentos.map((p) => {
      if (!cartao(p) || !p.maquininhaId) {
        return { ...p, maquininhaId: null, parcelas: null };
      }
      const maquininha = maquininhas.get(p.maquininhaId);
      if (!maquininha) throw new NaoEncontradoError('Maquininha');
      const parcelas = p.forma === 'CREDITO' ? (p.parcelas ?? 1) : null;
      return {
        ...p,
        parcelas,
        taxaBps: taxaDaMaquininha(maquininha, p.forma, parcelas ?? 1)!,
      };
    });
  }
}

function nomeDuplicado() {
  return new ConflitoError('NOME_EM_USO', 'Já existe uma maquininha com este nome.');
}

function paraMaquininhaDto(m: Maquininha): MaquininhaDto {
  return {
    id: m.id,
    nome: m.nome,
    taxaDebitoBps: m.taxaDebitoBps,
    taxasCreditoBps: m.taxasCreditoBps,
    ativo: m.ativo,
  };
}
