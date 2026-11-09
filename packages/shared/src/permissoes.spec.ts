import { describe, expect, it } from 'vitest';
import { PERMISSOES, permissoesEfetivas, permissoesPadrao } from './permissoes.js';

describe('permissões da equipe', () => {
  it('dono tem tudo, mesmo com lista salva', () => {
    expect(permissoesEfetivas('DONO', [])).toEqual([...PERMISSOES]);
  });

  it('sem personalização vale o padrão do papel', () => {
    expect(permissoesEfetivas('RECEPCAO', null)).toEqual(permissoesPadrao('RECEPCAO'));
    expect(permissoesEfetivas('PROFISSIONAL', undefined)).toEqual(['MINHAS_COMISSOES']);
    expect(permissoesPadrao('RECEPCAO')).not.toContain('FATURAMENTO');
    expect(permissoesPadrao('RECEPCAO')).not.toContain('COMISSOES');
  });

  it('personalizada: só as marcadas, ignorando valores desconhecidos', () => {
    expect(permissoesEfetivas('RECEPCAO', ['CAIXA', 'XYZ', 'AGENDA'])).toEqual(['AGENDA', 'CAIXA']);
    expect(permissoesEfetivas('PROFISSIONAL', [])).toEqual([]);
  });
});
