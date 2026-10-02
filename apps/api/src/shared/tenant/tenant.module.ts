import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ContextoSalao } from './contexto-salao.js';
import { SalaoAtivoGuard } from './salao-ativo.guard.js';
import { SalaoPublicoGuard } from './salao-publico.guard.js';
import { VinculosRepository } from './vinculos.repository.js';

@Global()
@Module({
  imports: [ClsModule.forRoot({ global: true, middleware: { mount: true } })],
  providers: [ContextoSalao, VinculosRepository, SalaoAtivoGuard, SalaoPublicoGuard],
  exports: [ContextoSalao, SalaoAtivoGuard, SalaoPublicoGuard, VinculosRepository],
})
export class TenantModule {}
