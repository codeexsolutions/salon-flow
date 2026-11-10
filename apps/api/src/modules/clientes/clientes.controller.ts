import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  anotacaoClienteSchema,
  atualizarClienteSchema,
  criarClienteSchema,
  type AnotacaoClienteInput,
  type AtualizarClienteInput,
  type CriarClienteInput,
} from '@salonflow/shared';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { ExigePermissao, RotaDoSalao } from '../../shared/tenant/rota-do-salao.decorator.js';
import { paraClienteResumo } from './clientes.mapper.js';
import { ClientesService } from './clientes.service.js';

const uuid = new ParseUUIDPipe();

@RotaDoSalao()
@ExigePermissao('AGENDA', 'COMANDAS', 'CLIENTES')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  /** ?busca=texto procura por nome, telefone ou e-mail. */
  @Get()
  async buscar(@Query('busca') busca?: string) {
    const clientes = await this.service.buscar(busca);
    return clientes.map(paraClienteResumo);
  }

  @Post()
  @ExigePermissao('AGENDA', 'COMANDAS', 'CLIENTES', 'CADASTRO_CLIENTES')
  async criar(@Body(new ZodValidationPipe(criarClienteSchema)) dados: CriarClienteInput) {
    return paraClienteResumo(await this.service.criar(dados));
  }

  /** Levantamento: todos os clientes com gasto, visitas e última vinda. */
  @Get('todos')
  @ExigePermissao('CLIENTES')
  lista() {
    return this.service.lista();
  }

  @Get(':id')
  @ExigePermissao('CLIENTES')
  detalhe(@Param('id', uuid) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.detalhe(id, usuario.id);
  }

  @Put(':id')
  @ExigePermissao('CLIENTES')
  async atualizar(
    @Param('id', uuid) id: string,
    @Body(new ZodValidationPipe(atualizarClienteSchema)) dados: AtualizarClienteInput,
  ) {
    return paraClienteResumo(await this.service.atualizar(id, dados));
  }

  /** Ficha técnica (também aparece na agenda e na comanda). ?limite=N */
  @Get(':id/anotacoes')
  anotacoes(
    @Param('id', uuid) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('limite') limite?: string,
  ) {
    const n = Number(limite);
    return this.service.anotacoes(id, usuario.id, n > 0 ? Math.min(n, 50) : undefined);
  }

  @Post(':id/anotacoes')
  @ExigePermissao('CLIENTES')
  criarAnotacao(
    @Param('id', uuid) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(anotacaoClienteSchema)) dados: AnotacaoClienteInput,
  ) {
    return this.service.criarAnotacao(id, usuario.id, dados);
  }

  @Put(':id/anotacoes/:anotacaoId')
  @ExigePermissao('CLIENTES')
  editarAnotacao(
    @Param('id', uuid) id: string,
    @Param('anotacaoId', uuid) anotacaoId: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(anotacaoClienteSchema)) dados: AnotacaoClienteInput,
  ) {
    return this.service.editarAnotacao(id, anotacaoId, usuario.id, dados);
  }

  @Delete(':id/anotacoes/:anotacaoId')
  @HttpCode(204)
  @ExigePermissao('CLIENTES')
  async excluirAnotacao(
    @Param('id', uuid) id: string,
    @Param('anotacaoId', uuid) anotacaoId: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    await this.service.excluirAnotacao(id, anotacaoId, usuario.id);
  }
}

/** App do profissional: ficha técnica dos clientes que ele atende. */
@RotaDoSalao()
@Controller('pro/clientes')
export class ProClientesController {
  constructor(private readonly service: ClientesService) {}

  @Get(':id/ficha')
  ficha(@Param('id', uuid) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.fichaPro(usuario.id, id);
  }

  @Post(':id/anotacoes')
  criar(
    @Param('id', uuid) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(anotacaoClienteSchema)) dados: AnotacaoClienteInput,
  ) {
    return this.service.criarAnotacaoPro(usuario.id, id, dados);
  }

  @Put(':id/anotacoes/:anotacaoId')
  editar(
    @Param('id', uuid) id: string,
    @Param('anotacaoId', uuid) anotacaoId: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(anotacaoClienteSchema)) dados: AnotacaoClienteInput,
  ) {
    return this.service.editarAnotacaoPro(usuario.id, id, anotacaoId, dados);
  }

  @Delete(':id/anotacoes/:anotacaoId')
  @HttpCode(204)
  async excluir(
    @Param('id', uuid) id: string,
    @Param('anotacaoId', uuid) anotacaoId: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    await this.service.excluirAnotacaoPro(usuario.id, id, anotacaoId);
  }
}
