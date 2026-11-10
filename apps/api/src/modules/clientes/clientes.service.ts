import { Injectable } from '@nestjs/common';
import type {
  AnotacaoClienteInput,
  AtualizarClienteInput,
  ClienteDetalhe,
  ClienteNaLista,
  CriarClienteInput,
  FichaClientePro,
} from '@salonflow/shared';
import { utcParaLocal } from '../../shared/domain/data-hora.js';
import {
  AcessoNegadoError,
  NaoEncontradoError,
  RegraDeNegocioError,
} from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { ProfissionaisService } from '../profissionais/profissionais.service.js';
import { paraAnotacao, paraClienteNaLista } from './clientes.mapper.js';
import { ClientesRepository, type TotaisBrutos } from './clientes.repository.js';
import { indicadoresDe, maisFrequentes, TOTAIS_VAZIOS } from './domain/indicadores.js';

@Injectable()
export class ClientesService {
  constructor(
    private readonly repository: ClientesRepository,
    private readonly profissionais: ProfissionaisService,
    private readonly contexto: ContextoSalao,
  ) {}

  buscar(termo = '', limite = 20) {
    return this.repository.buscar(this.contexto.salaoId, termo.trim(), Math.min(limite, 50));
  }

  criar(dados: CriarClienteInput) {
    return this.repository.criar(this.contexto.salaoId, dados);
  }

  /** Ficha do usuário logado no app neste salão (criada no primeiro agendamento). */
  garantirParaUsuario(usuario: { id: string; email: string; nome?: string }) {
    return this.repository.garantirParaUsuario(this.contexto.salaoId, {
      id: usuario.id,
      email: usuario.email.toLowerCase(),
      nome: usuario.nome?.trim() || usuario.email.split('@')[0],
    });
  }

  /** Garante que o cliente existe NESTE salão (usado pela agenda). */
  async obter(id: string) {
    const cliente = await this.repository.buscarPorId(this.contexto.salaoId, id);
    if (!cliente) throw new NaoEncontradoError('Cliente');
    return cliente;
  }

  // ---- Levantamento ----

  private dataLocal = (instante: Date) =>
    utcParaLocal(instante, this.contexto.fusoHorario).slice(0, 10);

  private indicadores(t: TotaisBrutos | undefined) {
    const hoje = this.dataLocal(new Date());
    if (!t) return indicadoresDe(TOTAIS_VAZIOS, hoje);
    return indicadoresDe(
      {
        ...t,
        primeiraVisita: t.primeira ? this.dataLocal(t.primeira) : null,
        ultimaVisita: t.ultima ? this.dataLocal(t.ultima) : null,
      },
      hoje,
    );
  }

  /** Todos os clientes do salão com quanto gastaram, visitas e última vinda. */
  async lista(): Promise<ClienteNaLista[]> {
    const salaoId = this.contexto.salaoId;
    const [clientes, totais] = await Promise.all([
      this.repository.todos(salaoId),
      this.repository.totais(salaoId),
    ]);
    return clientes.map((c) => paraClienteNaLista(c, this.indicadores(totais.get(c.id))));
  }

  async detalhe(id: string, usuarioId: string): Promise<ClienteDetalhe> {
    const salaoId = this.contexto.salaoId;
    const cliente = await this.obter(id);
    const [totais, comandas, proximos, anotacoes] = await Promise.all([
      this.repository.totais(salaoId, id),
      this.repository.atendimentos(salaoId, id, 100),
      this.repository.proximosAgendamentos(salaoId, id, new Date()),
      this.anotacoes(id, usuarioId),
    ]);
    const servicos = comandas.flatMap((c) =>
      c.itens.filter((i) => i.tipo === 'SERVICO').map((i) => i.descricao),
    );
    const profissionais = comandas.flatMap((c) =>
      c.itens.filter((i) => i.tipo === 'SERVICO').map((i) => i.profissional?.nome),
    );

    return {
      ...paraClienteNaLista(cliente, this.indicadores(totais.get(id))),
      observacoes: cliente.observacoes,
      atendimentos: comandas.map((c) => ({
        comandaId: c.id,
        numero: c.numero,
        data: this.dataLocal(c.fechadaEm!),
        totalCentavos: c.totalCentavos ?? 0,
        itens: c.itens.map((i) => ({
          descricao: i.quantidade > 1 ? `${i.quantidade}× ${i.descricao}` : i.descricao,
          profissional: i.profissional?.nome ?? null,
          valorCentavos: i.valorCentavos * i.quantidade,
        })),
      })),
      proximosAgendamentos: proximos.map((a) => ({
        id: a.id,
        inicio: a.inicio.toISOString(),
        servico: a.servico.nome,
        profissional: a.profissional.nome,
      })),
      servicosPreferidos: maisFrequentes(servicos),
      profissionaisPreferidos: maisFrequentes(profissionais),
      anotacoes,
    };
  }

  async atualizar(id: string, dados: AtualizarClienteInput) {
    await this.obter(id);
    return this.repository.atualizar(this.contexto.salaoId, id, dados);
  }

  // ---- Ficha técnica ----

  private podeEditar(autorId: string | null, usuarioId: string) {
    return autorId === usuarioId || this.contexto.papel === 'DONO';
  }

  async anotacoes(clienteId: string, usuarioId: string, limite?: number) {
    const lista = await this.repository.anotacoes(this.contexto.salaoId, clienteId, limite);
    return lista.map((a) => paraAnotacao(a, this.podeEditar(a.autorId, usuarioId)));
  }

  private async validarReferencias(dados: AnotacaoClienteInput) {
    const ok = await this.repository.referenciasValidas(
      this.contexto.salaoId,
      dados.servicoId,
      dados.profissionalId,
    );
    if (!ok)
      throw new RegraDeNegocioError(
        'REFERENCIA_INVALIDA',
        'Serviço ou profissional não encontrado neste salão.',
      );
  }

  async criarAnotacao(clienteId: string, usuarioId: string, dados: AnotacaoClienteInput) {
    await this.obter(clienteId);
    await this.validarReferencias(dados);
    const a = await this.repository.criarAnotacao(
      this.contexto.salaoId,
      clienteId,
      usuarioId,
      dados,
    );
    return paraAnotacao(a, true);
  }

  private async anotacaoEditavel(clienteId: string, id: string, usuarioId: string) {
    const a = await this.repository.anotacao(this.contexto.salaoId, id);
    if (!a || a.clienteId !== clienteId) throw new NaoEncontradoError('Anotação');
    if (!this.podeEditar(a.autorId, usuarioId)) {
      throw new AcessoNegadoError('Só quem escreveu (ou o dono) pode alterar esta anotação.');
    }
    return a;
  }

  async editarAnotacao(
    clienteId: string,
    id: string,
    usuarioId: string,
    dados: AnotacaoClienteInput,
  ) {
    await this.anotacaoEditavel(clienteId, id, usuarioId);
    await this.validarReferencias(dados);
    const a = await this.repository.atualizarAnotacao(this.contexto.salaoId, id, dados);
    return paraAnotacao(a, true);
  }

  async excluirAnotacao(clienteId: string, id: string, usuarioId: string) {
    await this.anotacaoEditavel(clienteId, id, usuarioId);
    await this.repository.excluirAnotacao(this.contexto.salaoId, id);
  }

  // ---- App do profissional: só clientes que ele atende ----

  private async profissionalDoCliente(usuarioId: string, clienteId: string) {
    const profissional = await this.profissionais.doUsuario(usuarioId);
    await this.obter(clienteId);
    const atende = await this.repository.profissionalAtende(
      this.contexto.salaoId,
      profissional.id,
      clienteId,
    );
    if (!atende) throw new AcessoNegadoError('Você ainda não atendeu este cliente.');
    return profissional;
  }

  async fichaPro(usuarioId: string, clienteId: string): Promise<FichaClientePro> {
    await this.profissionalDoCliente(usuarioId, clienteId);
    const [cliente, anotacoes, servicos] = await Promise.all([
      this.obter(clienteId),
      this.anotacoes(clienteId, usuarioId),
      this.repository.servicosAtivos(this.contexto.salaoId),
    ]);
    return {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        observacoes: cliente.observacoes,
      },
      anotacoes,
      servicos,
    };
  }

  /** O profissional registra sempre em nome dele. */
  async criarAnotacaoPro(usuarioId: string, clienteId: string, dados: AnotacaoClienteInput) {
    const profissional = await this.profissionalDoCliente(usuarioId, clienteId);
    return this.criarAnotacao(clienteId, usuarioId, { ...dados, profissionalId: profissional.id });
  }

  async editarAnotacaoPro(
    usuarioId: string,
    clienteId: string,
    id: string,
    dados: AnotacaoClienteInput,
  ) {
    const profissional = await this.profissionalDoCliente(usuarioId, clienteId);
    return this.editarAnotacao(clienteId, id, usuarioId, {
      ...dados,
      profissionalId: profissional.id,
    });
  }

  async excluirAnotacaoPro(usuarioId: string, clienteId: string, id: string) {
    await this.profissionalDoCliente(usuarioId, clienteId);
    await this.excluirAnotacao(clienteId, id, usuarioId);
  }
}
