import { RegraDeNegocioError } from '../../../shared/errors/domain.error.js';
import { papelAoAceitarConvite, validarAlteracaoAcesso } from './acesso.js';

describe('papelAoAceitarConvite', () => {
  it('novo membro recebe o papel do convite', () => {
    expect(papelAoAceitarConvite(null, 'RECEPCAO')).toBe('RECEPCAO');
  });

  it('profissional convidado para a recepção passa a ver o painel', () => {
    expect(papelAoAceitarConvite('PROFISSIONAL', 'RECEPCAO')).toBe('RECEPCAO');
  });

  it('nunca rebaixa o dono', () => {
    expect(papelAoAceitarConvite('DONO', 'RECEPCAO')).toBe('DONO');
  });
});

describe('validarAlteracaoAcesso', () => {
  it('permite alterar recepção e profissional', () => {
    expect(() => validarAlteracaoAcesso({ papel: 'RECEPCAO', ehVoce: false })).not.toThrow();
    expect(() => validarAlteracaoAcesso({ papel: 'PROFISSIONAL', ehVoce: false })).not.toThrow();
  });

  it('bloqueia alterar o próprio acesso', () => {
    expect(() => validarAlteracaoAcesso({ papel: 'RECEPCAO', ehVoce: true })).toThrow(
      RegraDeNegocioError,
    );
  });

  it('bloqueia remover um dono', () => {
    expect(() => validarAlteracaoAcesso({ papel: 'DONO', ehVoce: false })).toThrow(
      RegraDeNegocioError,
    );
  });
});
