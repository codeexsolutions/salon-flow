import { Injectable } from '@nestjs/common';
import { ClsService, type ClsStore } from 'nestjs-cls';
import type { Papel } from '@salonflow/shared';
import { AcessoNegadoError } from '../errors/domain.error.js';

export interface SalaoClsStore extends ClsStore {
  salaoId?: string;
  papel?: Papel;
  fusoHorario?: string;
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

  /** Fuso IANA do salão, para converter horários locais (agenda, folgas) em UTC. */
  get fusoHorario(): string {
    const fuso = this.cls.get('fusoHorario');
    if (!fuso) throw new AcessoNegadoError();
    return fuso;
  }

  definir(salaoId: string, papel: Papel, fusoHorario: string) {
    this.cls.set('salaoId', salaoId);
    this.cls.set('papel', papel);
    this.cls.set('fusoHorario', fusoHorario);
  }
}
