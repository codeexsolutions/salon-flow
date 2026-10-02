import { Injectable } from '@nestjs/common';
import type { CriarClienteInput } from '@salonflow/shared';
import { NaoEncontradoError } from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { ClientesRepository } from './clientes.repository.js';

@Injectable()
export class ClientesService {
  constructor(
    private readonly repository: ClientesRepository,
    private readonly contexto: ContextoSalao,
  ) {}

  buscar(termo = '', limite = 20) {
    return this.repository.buscar(this.contexto.salaoId, termo.trim(), Math.min(limite, 50));
  }

  criar(dados: CriarClienteInput) {
    return this.repository.criar(this.contexto.salaoId, dados);
  }

  /** Garante que o cliente existe NESTE salão (usado pela agenda). */
  async obter(id: string) {
    const cliente = await this.repository.buscarPorId(this.contexto.salaoId, id);
    if (!cliente) throw new NaoEncontradoError('Cliente');
    return cliente;
  }
}
