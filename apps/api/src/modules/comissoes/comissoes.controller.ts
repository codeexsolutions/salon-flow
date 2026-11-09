import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  configuracaoComissaoSchema,
  dataLocalSchema,
  definirRegrasComissaoSchema,
  gerarRepasseSchema,
  maquininhaSchema,
  type ConfiguracaoComissao,
  type DefinirRegrasComissaoInput,
  type GerarRepasseInput,
  type MaquininhaInput,
} from '@salonflow/shared';
import { z } from 'zod';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import {
  ExigePermissao,
  RotaDoSalao,
  SomentePapeis,
} from '../../shared/tenant/rota-do-salao.decorator.js';
import { ComissoesService } from './comissoes.service.js';
import { MaquininhasService } from './maquininhas.service.js';

const periodoSchema = z.object({
  de: dataLocalSchema,
  ate: dataLocalSchema,
  profissionalId: z.uuid().optional(),
});
type Periodo = z.infer<typeof periodoSchema>;

/** Comissões: consulta para quem tem a permissão; alterar e pagar, só o dono. */
@RotaDoSalao()
@ExigePermissao('COMISSOES')
@Controller('comissoes')
export class ComissoesController {
  constructor(private readonly service: ComissoesService) {}

  @Get('configuracao')
  configuracao() {
    return this.service.configuracao();
  }

  @SomentePapeis('DONO')
  @Put('configuracao')
  salvarConfiguracao(
    @Body(new ZodValidationPipe(configuracaoComissaoSchema)) dados: ConfiguracaoComissao,
  ) {
    return this.service.salvarConfiguracao(dados);
  }

  @Get('regras')
  regras() {
    return this.service.regras();
  }

  /** Substitui todas as regras do salão. */
  @SomentePapeis('DONO')
  @Put('regras')
  definirRegras(
    @Body(new ZodValidationPipe(definirRegrasComissaoSchema)) dados: DefinirRegrasComissaoInput,
  ) {
    return this.service.definirRegras(dados);
  }

  /** GET /comissoes/extrato?de=AAAA-MM-DD&ate=AAAA-MM-DD[&profissionalId=] */
  @Get('extrato')
  extrato(@Query(new ZodValidationPipe(periodoSchema)) { de, ate, profissionalId }: Periodo) {
    return this.service.extrato(de, ate, profissionalId);
  }

  /** Paga as comissões pendentes do período a um profissional. */
  @SomentePapeis('DONO')
  @Post('repasses')
  async gerarRepasse(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(gerarRepasseSchema)) dados: GerarRepasseInput,
  ) {
    const repasse = await this.service.gerarRepasse(dados, usuario.id);
    return this.service.repasse(repasse.id);
  }

  @Get('repasses')
  repasses(
    @Query('profissionalId', new ZodValidationPipe(z.uuid().optional())) profissionalId?: string,
  ) {
    return this.service.repasses(profissionalId);
  }

  /** Comprovante no formato salão-parceiro. */
  @Get('repasses/:id')
  repasse(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.repasse(id);
  }

  @SomentePapeis('DONO')
  @Post('repasses/:id/cancelar')
  cancelarRepasse(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancelarRepasse(id);
  }
}

/** App do profissional: o próprio extrato. */
@RotaDoSalao()
@ExigePermissao('MINHAS_COMISSOES')
@Controller('pro/comissoes')
export class ProComissoesController {
  constructor(private readonly service: ComissoesService) {}

  @Get()
  extrato(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query(new ZodValidationPipe(periodoSchema.omit({ profissionalId: true })))
    { de, ate }: Omit<Periodo, 'profissionalId'>,
  ) {
    return this.service.extratoDoUsuario(usuario.id, de, ate);
  }

  @Get('repasses')
  repasses(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.repassesDoUsuario(usuario.id);
  }

  @Get('repasses/:id')
  repasse(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.repasseDoUsuario(usuario.id, id);
  }
}

/** Maquininhas e suas taxas: a equipe que fecha comandas consulta; só o dono altera. */
@RotaDoSalao()
@ExigePermissao('COMANDAS', 'COMISSOES')
@Controller('maquininhas')
export class MaquininhasController {
  constructor(private readonly service: MaquininhasService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @SomentePapeis('DONO')
  @Post()
  criar(@Body(new ZodValidationPipe(maquininhaSchema)) dados: MaquininhaInput) {
    return this.service.criar(dados);
  }

  @SomentePapeis('DONO')
  @Put(':id')
  @HttpCode(204)
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(maquininhaSchema)) dados: MaquininhaInput,
  ) {
    return this.service.atualizar(id, dados);
  }
}
