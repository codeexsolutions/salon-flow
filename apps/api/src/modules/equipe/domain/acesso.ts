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
