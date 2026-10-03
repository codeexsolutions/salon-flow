import { RegraDeNegocioError } from '../../../shared/errors/domain.error.js';
import {
  papelAoAceitarConvite,
  validarAlteracaoAcesso,
  validarRedefinicaoSenha,
} from './acesso.js';

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

describe('validarRedefinicaoSenha', () => {
  const base = { papel: 'PROFISSIONAL' as const, ehVoce: false, temAcessoEmOutroSalao: false };

  it('permite para quem atua só neste salão', () => {
    expect(() => validarRedefinicaoSenha(base)).not.toThrow();
    expect(() => validarRedefinicaoSenha({ ...base, papel: 'RECEPCAO' })).not.toThrow();
  });

  it('bloqueia a própria senha e a de um dono', () => {
    expect(() => validarRedefinicaoSenha({ ...base, ehVoce: true })).toThrow(RegraDeNegocioError);
    expect(() => validarRedefinicaoSenha({ ...base, papel: 'DONO' })).toThrow(RegraDeNegocioError);
  });

  it('bloqueia quem tem acesso a outro salão (evita tomar a conta)', () => {
    expect(() => validarRedefinicaoSenha({ ...base, temAcessoEmOutroSalao: true })).toThrow(
      RegraDeNegocioError,
    );
  });
});
