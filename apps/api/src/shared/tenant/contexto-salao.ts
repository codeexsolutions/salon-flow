import { Injectable } from '@nestjs/common';
import { ClsService, type ClsStore } from 'nestjs-cls';
import type { Papel } from '@salonflow/shared';
import { AcessoNegadoError } from '../errors/domain.error.js';

export interface SalaoClsStore extends ClsStore {
  salaoId?: string;
  papel?: Papel;
}

/**
 * Salão em que o usuário está operando nesta requisição (preenchido pelo SalaoAtivoGuard).
 * Repositories de dados do salão usam `salaoId` em TODAS as consultas.
 */
@Injectable()
export class ContextoSalao {
  constructor(private readonly cls: ClsService<SalaoClsStore>) {}

  get salaoId(): string {
    const id = this.cls.get('salaoId');
    if (!id) {
      throw new AcessoNegadoError('Rota usada fora de um contexto de salão (falta @RotaDoSalao)');
    }
    return id;
  }

  get papel(): Papel {
    const papel = this.cls.get('papel');
    if (!papel) throw new AcessoNegadoError();
    return papel;
  }

  definir(salaoId: string, papel: Papel) {
    this.cls.set('salaoId', salaoId);
    this.cls.set('papel', papel);
  }
}
