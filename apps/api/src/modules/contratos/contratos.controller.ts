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
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  contratoSchema,
  encerrarContratoSchema,
  TAMANHO_MAXIMO_CONTRATO_BYTES,
  type ContratoInput,
  type EncerrarContratoInput,
} from '@salonflow/shared';
import { z } from 'zod';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao } from '../../shared/tenant/rota-do-salao.decorator.js';
import { ContratosService, type ArquivoEnviado } from './contratos.service.js';

/** Baixa o PDF guardado (nome seguro no cabeçalho). */
function paraDownload(arquivo: { nome: string; conteudo: Uint8Array }) {
  const nome = arquivo.nome.replace(/[^\w.\- ]/g, '_');
  return new StreamableFile(Buffer.from(arquivo.conteudo), {
    type: 'application/pdf',
    disposition: `attachment; filename="${nome}"`,
    length: arquivo.conteudo.length,
  });
}

/** Contratos de parceria (Lei 13.352/2016). Só o dono. */
@RotaDoSalao('DONO')
@Controller('contratos')
export class ContratosController {
  constructor(private readonly service: ContratosService) {}

  /** Profissionais ativos e a situação do contrato de cada um. */
  @Get('situacao')
  situacao() {
    return this.service.situacao();
  }

  @Get()
  historico(
    @Query('profissionalId', new ZodValidationPipe(z.uuid().optional())) profissionalId?: string,
  ) {
    return this.service.historico(profissionalId);
  }

  @Get('sugestao/:profissionalId')
  sugestao(@Param('profissionalId', ParseUUIDPipe) profissionalId: string) {
    return this.service.sugestao(profissionalId);
  }

  @Get(':id')
  detalhe(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.detalhe(id);
  }

  @Post()
  criar(@Body(new ZodValidationPipe(contratoSchema)) dados: ContratoInput) {
    return this.service.criar(dados);
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(contratoSchema)) dados: ContratoInput,
  ) {
    return this.service.atualizar(id, dados);
  }

  @Post(':id/ativar')
  ativar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.ativar(id);
  }

  @Post(':id/encerrar')
  encerrar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(encerrarContratoSchema)) dados: EncerrarContratoInput,
  ) {
    return this.service.encerrar(id, dados);
  }

  @Delete(':id')
  @HttpCode(204)
  excluir(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.excluir(id);
  }

  /** PDF do contrato assinado (multipart, campo "arquivo"). */
  @Put(':id/arquivo')
  @UseInterceptors(
    FileInterceptor('arquivo', { limits: { fileSize: TAMANHO_MAXIMO_CONTRATO_BYTES + 1 } }),
  )
  enviarArquivo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() arquivo: ArquivoEnviado | undefined,
  ) {
    return this.service.salvarArquivo(id, arquivo);
  }

  @Get(':id/arquivo')
  async baixarArquivo(@Param('id', ParseUUIDPipe) id: string) {
    return paraDownload(await this.service.arquivo(id));
  }
}

/** App do profissional: o próprio contrato. */
@RotaDoSalao()
@Controller('pro/contrato')
export class ProContratoController {
  constructor(private readonly service: ContratosService) {}

  @Get()
  async meuContrato(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return { contrato: await this.service.doUsuario(usuario.id) };
  }

  @Get('arquivo')
  async meuArquivo(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return paraDownload(await this.service.arquivoDoUsuario(usuario.id));
  }
}
