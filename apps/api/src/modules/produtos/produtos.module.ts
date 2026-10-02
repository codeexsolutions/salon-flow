import { Module } from '@nestjs/common';
import { ServicosModule } from '../servicos/servicos.module.js';
import { FichaTecnicaController, ProdutosController } from './produtos.controller.js';
import { ProdutosRepository } from './produtos.repository.js';
import { ProdutosService } from './produtos.service.js';

@Module({
  imports: [ServicosModule],
  controllers: [ProdutosController, FichaTecnicaController],
  providers: [ProdutosService, ProdutosRepository],
  exports: [ProdutosService],
})
export class ProdutosModule {}
