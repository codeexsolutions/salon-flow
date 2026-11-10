import type { Papel } from './enums.js';

/**
 * O que o dono pode liberar para cada pessoa da equipe. O dono tem tudo sempre.
 * Equipe, configurações, cadastro de serviços/produtos e as correções (reabrir
 * caixa/comanda, lançar em data anterior) continuam só do dono.
 */
export const PERMISSOES = [
  'AGENDA',
  'COMANDAS',
  'CADASTRO_CLIENTES',
  'CLIENTES',
  'CAIXA',
  'PROFISSIONAIS',
  'ESTOQUE',
  'FATURAMENTO',
  'COMISSOES',
  'MINHAS_COMISSOES',
] as const;
export type Permissao = (typeof PERMISSOES)[number];

export const ROTULO_PERMISSAO: Record<Permissao, { rotulo: string; descricao: string }> = {
  AGENDA: {
    rotulo: 'Agenda do salão',
    descricao: 'Ver e marcar horários de todos os profissionais',
  },
  COMANDAS: { rotulo: 'Comandas', descricao: 'Abrir, lançar e fechar comandas' },
  CADASTRO_CLIENTES: {
    rotulo: 'Cadastrar clientes',
    descricao: 'Só o formulário de cadastro (sem histórico nem valores)',
  },
  CLIENTES: {
    rotulo: 'Clientes: histórico e ficha',
    descricao: 'Quanto cada cliente gastou, visitas e ficha técnica',
  },
  CAIXA: { rotulo: 'Caixa', descricao: 'Abrir, entradas e saídas, fechar' },
  PROFISSIONAIS: { rotulo: 'Profissionais', descricao: 'Jornada e folgas da equipe' },
  ESTOQUE: { rotulo: 'Estoque', descricao: 'Entradas e saídas de produtos' },
  FATURAMENTO: { rotulo: 'Faturamento', descricao: 'Relatório de faturamento do salão' },
  COMISSOES: { rotulo: 'Comissões de todos', descricao: 'Extrato e repasses (só consulta)' },
  MINHAS_COMISSOES: {
    rotulo: 'Ver as próprias comissões',
    descricao: 'No app do profissional, os valores das comissões dele',
  },
};

/** Permissões do painel (as que dão acesso a /admin). */
export const PERMISSOES_PAINEL: readonly Permissao[] = PERMISSOES.filter(
  (p) => p !== 'MINHAS_COMISSOES',
);

/** O que cada papel tem quando o dono não personalizou. */
export function permissoesPadrao(papel: Papel): Permissao[] {
  switch (papel) {
    case 'DONO':
      return [...PERMISSOES];
    case 'RECEPCAO':
      return [
        'AGENDA',
        'COMANDAS',
        'CADASTRO_CLIENTES',
        'CAIXA',
        'PROFISSIONAIS',
        'ESTOQUE',
        'MINHAS_COMISSOES',
      ];
    case 'PROFISSIONAL':
      return ['MINHAS_COMISSOES'];
  }
}

/**
 * Permissões que valem para a pessoa: dono = tudo; sem personalização = padrão
 * do papel; senão, as marcadas (ignorando valores desconhecidos).
 */
export function permissoesEfetivas(papel: Papel, salvas: unknown): Permissao[] {
  if (papel === 'DONO' || !Array.isArray(salvas)) return permissoesPadrao(papel);
  return PERMISSOES.filter((p) => salvas.includes(p));
}
