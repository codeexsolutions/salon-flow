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
  assinaturaPushSchema,
  cancelarPushSchema,
  configMensagensSchema,
  dataLocalSchema,
  responderAvaliacaoSchema,
  type AssinaturaPushInput,
  type ConfigMensagensInput,
  type ResponderAvaliacaoInput,
} from '@salonflow/shared';
import { Publica, UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import {
  ExigePermissao,
  RotaDoSalao,
  SomentePapeis,
} from '../../shared/tenant/rota-do-salao.decorator.js';
import { NotificacoesService } from './notificacoes.service.js';
import { PushService } from './push.service.js';

const uuid = new ParseUUIDPipe();
const data = new ZodValidationPipe(dataLocalSchema);

/** Inscrição do aparelho do usuário para receber push. */
@Controller()
export class PushController {
  constructor(
    private readonly service: NotificacoesService,
    private readonly push: PushService,
  ) {}

  @Publica()
  @Get('push/chave-publica')
  chavePublica() {
    return { chave: this.push.chavePublica };
  }

  @Post('me/push')
  @HttpCode(204)
  async inscrever(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(assinaturaPushSchema)) dados: AssinaturaPushInput,
  ) {
    await this.service.inscrever(usuario.id, dados);
  }

  @Post('me/push/cancelar')
  @HttpCode(204)
  async cancelar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(cancelarPushSchema)) { endpoint }: { endpoint: string },
  ) {
    await this.service.cancelar(usuario.id, endpoint);
  }
}

/** Modelos de mensagem do WhatsApp e horários dos pushes automáticos. */
@RotaDoSalao()
@Controller('mensagens')
export class MensagensController {
  constructor(private readonly service: NotificacoesService) {}

  /** Qualquer pessoa da equipe usa os modelos (botões de WhatsApp). */
  @Get('config')
  config() {
    return this.service.config();
  }

  @Put('config')
  @SomentePapeis('DONO')
  salvar(@Body(new ZodValidationPipe(configMensagensSchema)) dados: ConfigMensagensInput) {
    return this.service.salvarConfig(dados);
  }
}

@RotaDoSalao()
@Controller('avaliacoes')
export class AvaliacoesController {
  constructor(private readonly service: NotificacoesService) {}

  /** ?de=AAAA-MM-DD&ate=AAAA-MM-DD (data do atendimento). */
  @Get()
  @ExigePermissao('CLIENTES', 'FATURAMENTO')
  relatorio(@Query('de', data) de: string, @Query('ate', data) ate: string) {
    return this.service.relatorio(de, ate);
  }

  /** Link de avaliação da comanda (para mandar pelo WhatsApp). */
  @Get('comanda/:comandaId')
  @ExigePermissao('COMANDAS', 'CLIENTES')
  link(@Param('comandaId', uuid) comandaId: string) {
    return this.service.linkAvaliacao(comandaId);
  }
}

/** Página de avaliação aberta pelo cliente (o token do link é a autorização). */
@Publica()
@Controller('avaliacao-publica')
export class AvaliacaoPublicaController {
  constructor(private readonly service: NotificacoesService) {}

  @Get(':token')
  ver(@Param('token', uuid) token: string) {
    return this.service.avaliacaoPublica(token);
  }

  @Post(':token')
  responder(
    @Param('token', uuid) token: string,
    @Body(new ZodValidationPipe(responderAvaliacaoSchema)) dados: ResponderAvaliacaoInput,
  ) {
    return this.service.responder(token, dados);
  }
}
