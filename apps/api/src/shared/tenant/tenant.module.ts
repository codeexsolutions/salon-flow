import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ContextoSalao } from './contexto-salao.js';
import { SalaoAtivoGuard } from './salao-ativo.guard.js';
import { VinculosRepository } from './vinculos.repository.js';

@Global()
@Module({
  imports: [ClsModule.forRoot({ global: true, middleware: { mount: true } })],
  providers: [ContextoSalao, VinculosRepository, SalaoAtivoGuard],
  exports: [ContextoSalao, SalaoAtivoGuard, VinculosRepository],
})
export class TenantModule {}
