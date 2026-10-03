import type { Papel } from '@salonflow/shared';
import { RegraDeNegocioError } from '../../../shared/errors/domain.error.js';

/**
 * Papel final de quem aceita um convite. O dono nunca é rebaixado; um
 * profissional convidado para a recepção passa a ver o painel (e continua
 * com o app do profissional, que depende do cadastro de profissional).
 */
export function papelAoAceitarConvite(atual: Papel | null, convidado: Papel): Papel {
  return atual === 'DONO' ? 'DONO' : convidado;
}

/** Quem pode ter o acesso ligado/desligado pelo dono na tela Equipe. */
export function validarAlteracaoAcesso(alvo: { papel: Papel; ehVoce: boolean }) {
  if (alvo.ehVoce) {
    throw new RegraDeNegocioError('PROPRIO_ACESSO', 'Você não pode alterar o seu próprio acesso.');
  }
  if (alvo.papel === 'DONO') {
    throw new RegraDeNegocioError('ACESSO_DONO', 'O acesso de um dono não pode ser removido.');
  }
}

/**
 * O dono define uma senha nova para alguém da equipe que esqueceu a dele.
 * Só vale para quem atua APENAS neste salão: senão um dono poderia assumir a
 * conta de alguém que tem acesso (ou é dono) em outro salão.
 */
export function validarRedefinicaoSenha(alvo: {
  papel: Papel;
  ehVoce: boolean;
  temAcessoEmOutroSalao: boolean;
}) {
  if (alvo.ehVoce) {
    throw new RegraDeNegocioError(
      'PROPRIA_SENHA',
      'Para trocar a sua senha, use o menu Senha.',
    );
  }
  if (alvo.papel === 'DONO') {
    throw new RegraDeNegocioError('SENHA_DONO', 'A senha de um dono não pode ser redefinida.');
  }
  if (alvo.temAcessoEmOutroSalao) {
    throw new RegraDeNegocioError(
      'ACESSO_OUTRO_SALAO',
      'Esta pessoa também tem acesso a outro salão; só ela pode trocar a própria senha.',
    );
  }
}
