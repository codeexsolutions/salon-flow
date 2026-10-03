import { Injectable } from '@nestjs/common';
import {
  emailDeLogin,
  type CodigoRecuperacao,
  type RecuperarSenhaInput,
} from '@salonflow/shared';
import { SupabaseAdminService } from '../../shared/auth/supabase-admin.service.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { aleatorioSeguro, conferirCodigo, hashCodigo } from '../../shared/crypto/hash-codigo.js';
import { RegraDeNegocioError } from '../../shared/errors/domain.error.js';
import {
  estaBloqueada,
  formatarCodigo,
  gerarCodigo,
  registrarFalha,
} from './domain/recuperacao.js';
import { UsuariosRepository } from './usuarios.repository.js';

/**
 * "Esqueci minha senha" sem e-mail: no cadastro a pessoa informa o celular e
 * recebe um código para guardar. Usuário + celular + código liberam uma senha nova.
 */
@Injectable()
export class RecuperacaoService {
  constructor(
    private readonly repository: UsuariosRepository,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  /** Gera (ou troca) o código da conta logada. O código só aparece nesta resposta. */
  async definir(usuario: UsuarioAutenticado, telefone: string): Promise<CodigoRecuperacao> {
    await this.repository.upsert(usuario);
    return this.novoCodigo(usuario.id, telefone);
  }

  async recuperar(dados: RecuperarSenhaInput): Promise<CodigoRecuperacao> {
    const agora = new Date();
    const conta = await this.repository.buscarParaRecuperacao(emailDeLogin(dados.usuario));
    const estado = {
      tentativas: conta?.recuperacaoTentativas ?? 0,
      bloqueadaAte: conta?.recuperacaoBloqueadaAte ?? null,
    };

    if (conta && estaBloqueada(estado, agora)) {
      throw new RegraDeNegocioError(
        'RECUPERACAO_BLOQUEADA',
        'Muitas tentativas erradas. Tente de novo em 30 minutos.',
      );
    }

    const confere =
      !!conta?.recuperacaoHash &&
      conta.telefone === dados.telefone &&
      (await conferirCodigo(dados.codigo, conta.recuperacaoHash));

    if (!conta || !confere) {
      if (conta) await this.repository.salvarTentativas(conta.id, registrarFalha(estado, agora));
      // Mesma mensagem para tudo: não revela se o usuário existe nem qual dado errou.
      throw new RegraDeNegocioError(
        'RECUPERACAO_INVALIDA',
        'Usuário, celular ou código incorretos.',
      );
    }

    await this.supabaseAdmin.redefinirSenha(conta.id, dados.senha, { provisoria: false });
    // O código usado deixa de valer: a pessoa recebe outro para guardar.
    return this.novoCodigo(conta.id, dados.telefone);
  }

  private async novoCodigo(usuarioId: string, telefone: string): Promise<CodigoRecuperacao> {
    const codigo = gerarCodigo(aleatorioSeguro);
    await this.repository.salvarRecuperacao(usuarioId, telefone, await hashCodigo(codigo));
    return { codigo: formatarCodigo(codigo) };
  }
}
