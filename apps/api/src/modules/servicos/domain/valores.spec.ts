import { valoresDoProfissional } from './valores.js';

const corte = { precoCentavos: 5000, duracaoMin: 40 };

describe('valoresDoProfissional', () => {
  it('usa os valores do serviço quando o profissional não tem próprios', () => {
    expect(valoresDoProfissional(corte, { precoCentavos: null, duracaoMin: null })).toEqual(corte);
  });

  it('usa os valores próprios do profissional', () => {
    expect(valoresDoProfissional(corte, { precoCentavos: 8000, duracaoMin: 60 })).toEqual({
      precoCentavos: 8000,
      duracaoMin: 60,
    });
  });

  it('combina: preço próprio e duração do serviço', () => {
    expect(valoresDoProfissional(corte, { precoCentavos: 7000, duracaoMin: null })).toEqual({
      precoCentavos: 7000,
      duracaoMin: 40,
    });
  });

  it('aceita preço próprio zero (cortesia) sem cair no preço do serviço', () => {
    expect(valoresDoProfissional(corte, { precoCentavos: 0, duracaoMin: null }).precoCentavos).toBe(
      0,
    );
  });
});
