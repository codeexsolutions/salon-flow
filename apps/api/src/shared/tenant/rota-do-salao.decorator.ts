import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import type { Papel } from '@salonflow/shared';
import { SalaoAtivoGuard } from './salao-ativo.guard.js';
import { PAPEIS_PERMITIDOS } from './tenant.constants.js';

/**
 * Marca a rota (ou o controller inteiro) como operação dentro de um salão.
 * Sem papéis, qualquer membro do salão acessa. Ex.: `@RotaDoSalao('DONO', 'RECEPCAO')`
 */
export const RotaDoSalao = (...papeis: Papel[]) =>
  applyDecorators(SetMetadata(PAPEIS_PERMITIDOS, papeis), UseGuards(SalaoAtivoGuard));

/**
 * Restringe UM método de um controller que já usa @RotaDoSalao na classe
 * (não registra o guard de novo, só sobrescreve os papéis permitidos).
 */
export const SomentePapeis = (...papeis: Papel[]) => SetMetadata(PAPEIS_PERMITIDOS, papeis);
