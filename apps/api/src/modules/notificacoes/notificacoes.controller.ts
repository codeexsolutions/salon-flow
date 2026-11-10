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
  assinaturaPushSchema,
  cancelarPushSchema,
  configMensagensSchema,
  enviarPushSchema,
  dataLocalSchema,
  responderAvaliacaoSchema,
  type AssinaturaPushInput,
  type ConfigMensagensInput,
  type EnviarPushInput,
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

  /** Sino do app: notificações dos últimos dias (as antigas são apagadas). */
  @Get('me/notificacoes')
  notificacoes(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.minhasNotificacoes(usuario.id);
  }

  @Get('me/notificacoes/contagem')
  contagem(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.contarNotificacoes(usuario.id);
  }

  /** Abrir = apagar da caixa e devolver a página de destino. */
  @Post('me/notificacoes/:id/abrir')
  abrir(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id', uuid) id: string) {
    return this.service.abrirNotificacao(usuario.id, id);
  }

  @Delete('me/notificacoes')
  @HttpCode(204)
  async limpar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    await this.service.limparNotificacoes(usuario.id);
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

  @Get('assinantes')
  @SomentePapeis('DONO')
  assinantes() {
    return this.service.assinantes();
  }

  @Post('push')
  @SomentePapeis('DONO')
  enviarPush(@Body(new ZodValidationPipe(enviarPushSchema)) dados: EnviarPushInput) {
    return this.service.enviarPush(dados);
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
