import {
  PERMISSOES_PAINEL,
  permissoesPadrao,
  type Permissao,
  type VinculoSalao,
} from '@salonflow/shared';

/** O que está liberado para a pessoa no salão (API antiga sem a lista: padrão do papel). */
export const permissoesDe = (s: VinculoSalao): Permissao[] =>
  s.permissoes ?? permissoesPadrao(s.papel);

/** A pessoa pode usar esta área? (o dono pode tudo) */
export const pode = (s: VinculoSalao, permissao: Permissao) =>
  s.papel === 'DONO' || permissoesDe(s).includes(permissao);

/**
 * Usam o painel: dono, recepção e o profissional para quem o dono liberou
 * alguma área do painel.
 */
export const usaPainel = (s: VinculoSalao) =>
  s.papel === 'DONO' ||
  s.papel === 'RECEPCAO' ||
  permissoesDe(s).some((p) => PERMISSOES_PAINEL.includes(p));
