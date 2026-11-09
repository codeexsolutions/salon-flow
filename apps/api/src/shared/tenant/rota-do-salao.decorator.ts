import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import type { Papel, Permissao } from '@salonflow/shared';
import { SalaoAtivoGuard } from './salao-ativo.guard.js';
import { PAPEIS_PERMITIDOS, PERMISSOES_EXIGIDAS } from './tenant.constants.js';

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

/**
 * Exige que a pessoa tenha UMA das permissões liberadas pelo dono (o dono sempre
 * passa). Use junto com @RotaDoSalao() na classe; no método, sobrescreve a da classe.
 */
export const ExigePermissao = (...permissoes: Permissao[]) =>
  SetMetadata(PERMISSOES_EXIGIDAS, permissoes);
