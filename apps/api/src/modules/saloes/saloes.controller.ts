import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  atualizarSalaoSchema,
  buscaSaloesSchema,
  criarSalaoSchema,
  type AtualizarSalaoInput,
  type BuscaSaloesInput,
  type CriarSalaoInput,
  type FiltrosDiretorio,
  type Paginado,
  type SalaoMarketplace,
} from '@salonflow/shared';
import { Publica, UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao } from '../../shared/tenant/rota-do-salao.decorator.js';
import { paraSalaoConfiguracao, paraSalaoPublico } from './saloes.mapper.js';
import { SaloesService } from './saloes.service.js';

/**
 * Camada de APRESENTAÇÃO: recebe HTTP, valida a entrada e devolve a resposta.
 * Nenhuma regra de negócio aqui.
 */
@Controller('saloes')
export class SaloesController {
  constructor(private readonly service: SaloesService) {}

  /** Qualquer usuário logado pode cadastrar um salão (vira DONO dele). */
  @Post()
  criar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(criarSalaoSchema)) dados: CriarSalaoInput,
  ) {
    return this.service.criar(usuario, dados);
  }

  /** Salão ativo (header x-salao-id). Declarado antes de ':slug' para não conflitar. */
  @RotaDoSalao()
  @Get('atual')
  async atual() {
    return paraSalaoConfiguracao(await this.service.atual());
  }

  @RotaDoSalao('DONO')
  @Patch('atual')
  async atualizar(@Body(new ZodValidationPipe(atualizarSalaoSchema)) dados: AtualizarSalaoInput) {
    return paraSalaoConfiguracao(await this.service.atualizar(dados));
  }

  /** GET /saloes?busca=&cidade=&categoria=&pagina= — diretório público (paginado). */
  @Publica()
  @Get()
  async buscarMarketplace(
    @Query(new ZodValidationPipe(buscaSaloesSchema)) filtros: BuscaSaloesInput,
  ): Promise<Paginado<SalaoMarketplace>> {
    const r = await this.service.buscarMarketplace(filtros);
    return {
      ...r,
      itens: r.itens.map((s) => ({ ...paraSalaoPublico(s), totalServicos: s._count.servicos })),
    };
  }

  /** Opções de filtro do diretório (cidades e categorias). Antes de ':slug'. */
  @Publica()
  @Get('filtros')
  filtros(): Promise<FiltrosDiretorio> {
    return this.service.filtrosMarketplace();
  }

  /** Página pública do salão (app do cliente / marketplace). */
  @Publica()
  @Get(':slug')
  async buscarPublico(@Param('slug') slug: string) {
    return paraSalaoPublico(await this.service.buscarPublico(slug));
  }
}
