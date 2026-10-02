import { Module } from '@nestjs/common';
import { AgendaModule } from '../agenda/agenda.module.js';
import { CaixaModule } from '../caixa/caixa.module.js';
import { ClientesModule } from '../clientes/clientes.module.js';
import { ComissoesModule } from '../comissoes/comissoes.module.js';
import { ProdutosModule } from '../produtos/produtos.module.js';
import { ServicosModule } from '../servicos/servicos.module.js';
import { ComandasController } from './comandas.controller.js';
import { ComandasRepository } from './comandas.repository.js';
import { ComandasService } from './comandas.service.js';

@Module({
  imports: [
    AgendaModule,
    CaixaModule,
    ClientesModule,
    ComissoesModule,
    ProdutosModule,
    ServicosModule,
  ],
  controllers: [ComandasController],
  providers: [ComandasService, ComandasRepository],
})
export class ComandasModule {}
