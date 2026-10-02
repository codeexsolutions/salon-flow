import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  atualizarProdutoSchema,
  criarProdutoSchema,
  definirFichaTecnicaSchema,
  movimentarEstoqueSchema,
  type AtualizarProdutoInput,
  type CriarProdutoInput,
  type DefinirFichaTecnicaInput,
  type MovimentarEstoqueInput,
} from '@salonflow/shared';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao, SomentePapeis } from '../../shared/tenant/rota-do-salao.decorator.js';
import { paraMovimento, paraProdutoResumo } from './produtos.mapper.js';
import { ProdutosService } from './produtos.service.js';

/** Produtos e estoque. Recepção consulta e lança entradas; só o dono cadastra/edita. */
@RotaDoSalao('DONO', 'RECEPCAO')
@Controller('produtos')
export class ProdutosController {
  constructor(private readonly service: ProdutosService) {}

  @Get()
  async listar(@Query('incluirInativos') incluirInativos?: string) {
    return (await this.service.listar(incluirInativos === 'true')).map(paraProdutoResumo);
  }

  @SomentePapeis('DONO')
  @Post()
  async criar(@Body(new ZodValidationPipe(criarProdutoSchema)) dados: CriarProdutoInput) {
    return paraProdutoResumo(await this.service.criar(dados));
  }

  @Get(':id')
  async buscar(@Param('id', ParseUUIDPipe) id: string) {
    return paraProdutoResumo(await this.service.buscar(id));
  }

  @SomentePapeis('DONO')
  @Patch(':id')
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(atualizarProdutoSchema)) dados: AtualizarProdutoInput,
  ) {
    return paraProdutoResumo(await this.service.atualizar(id, dados));
  }

  /** Entrada (compra) ou ajuste manual de estoque. */
  @Post(':id/movimentos')
  async movimentar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(movimentarEstoqueSchema)) dados: MovimentarEstoqueInput,
  ) {
    return paraProdutoResumo(await this.service.movimentar(id, dados, usuario.id));
  }

  @Get(':id/movimentos')
  async movimentos(@Param('id', ParseUUIDPipe) id: string) {
    return (await this.service.movimentos(id)).map(paraMovimento);
  }
}

/** Ficha técnica de um serviço (produtos consumidos em cada atendimento). */
@RotaDoSalao('DONO', 'RECEPCAO')
@Controller('servicos/:servicoId/ficha-tecnica')
export class FichaTecnicaController {
  constructor(private readonly service: ProdutosService) {}

  @Get()
  ficha(@Param('servicoId', ParseUUIDPipe) servicoId: string) {
    return this.service.fichaTecnica(servicoId);
  }

  @SomentePapeis('DONO')
  @Put()
  definir(
    @Param('servicoId', ParseUUIDPipe) servicoId: string,
    @Body(new ZodValidationPipe(definirFichaTecnicaSchema)) dados: DefinirFichaTecnicaInput,
  ) {
    return this.service.definirFichaTecnica(servicoId, dados);
  }
}
