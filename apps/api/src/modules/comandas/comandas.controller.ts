import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  adicionarItemComandaSchema,
  atualizarComandaSchema,
  atualizarItemComandaSchema,
  criarComandaSchema,
  dataAtendimentoComandaSchema,
  dataLocalSchema,
  fecharComandaSchema,
  reabrirComandaSchema,
  type AdicionarItemComandaInput,
  type AtualizarComandaInput,
  type AtualizarItemComandaInput,
  type CriarComandaInput,
  type DataAtendimentoComandaInput,
  type FecharComandaInput,
  type ReabrirComandaInput,
} from '@salonflow/shared';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao, SomentePapeis } from '../../shared/tenant/rota-do-salao.decorator.js';
import { paraComandaDetalhe, paraComandaResumo } from './comandas.mapper.js';
import { ComandasService } from './comandas.service.js';

/** Comandas: abertura, itens, desconto, fechamento (com comissões) e cancelamento. */
@RotaDoSalao('DONO', 'RECEPCAO')
@Controller('comandas')
export class ComandasController {
  constructor(private readonly service: ComandasService) {}

  /** GET /comandas?data=AAAA-MM-DD — abertas + fechadas/canceladas no dia. */
  @Get()
  async listar(@Query('data', new ZodValidationPipe(dataLocalSchema)) data: string) {
    return (await this.service.listar(data)).map(paraComandaResumo);
  }

  @Post()
  async criar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(criarComandaSchema)) dados: CriarComandaInput,
  ) {
    return paraComandaDetalhe(await this.service.criar(dados, usuario.id));
  }

  @Get(':id')
  async buscar(@Param('id', ParseUUIDPipe) id: string) {
    return paraComandaDetalhe(await this.service.buscar(id));
  }

  @Patch(':id')
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(atualizarComandaSchema)) dados: AtualizarComandaInput,
  ) {
    return paraComandaDetalhe(await this.service.atualizar(id, dados));
  }

  @Post(':id/itens')
  async adicionarItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(adicionarItemComandaSchema)) dados: AdicionarItemComandaInput,
  ) {
    return paraComandaDetalhe(await this.service.adicionarItem(id, dados));
  }

  @Patch(':id/itens/:itemId')
  async atualizarItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body(new ZodValidationPipe(atualizarItemComandaSchema)) dados: AtualizarItemComandaInput,
  ) {
    return paraComandaDetalhe(await this.service.atualizarItem(id, itemId, dados));
  }

  @Delete(':id/itens/:itemId')
  async removerItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return paraComandaDetalhe(await this.service.removerItem(id, itemId));
  }

  @Post(':id/fechar')
  async fechar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(fecharComandaSchema)) dados: FecharComandaInput,
  ) {
    return paraComandaDetalhe(await this.service.fechar(id, dados, usuario.id));
  }

  /** Lançamento atrasado: dia em que o atendimento aconteceu. Só o dono. */
  @Patch(':id/data-atendimento')
  @SomentePapeis('DONO')
  async definirDataAtendimento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(dataAtendimentoComandaSchema)) dados: DataAtendimentoComandaInput,
  ) {
    return paraComandaDetalhe(await this.service.definirDataAtendimento(id, dados));
  }

  /** Reabre comanda fechada para correção. Só o dono. */
  @Post(':id/reabrir')
  @SomentePapeis('DONO')
  async reabrir(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(reabrirComandaSchema)) dados: ReabrirComandaInput,
  ) {
    return paraComandaDetalhe(await this.service.reabrir(id, dados, usuario.id));
  }

  @Post(':id/cancelar')
  async cancelar(@Param('id', ParseUUIDPipe) id: string) {
    return paraComandaDetalhe(await this.service.cancelar(id));
  }
}
