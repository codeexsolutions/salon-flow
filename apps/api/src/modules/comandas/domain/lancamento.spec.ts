import {
  ajustarConferencia,
  diasEntre,
  planoDeCaixa,
  validarDataAtendimento,
} from './lancamento.js';

describe('validarDataAtendimento', () => {
  it('aceita hoje e até 30 dias para trás', () => {
    expect(validarDataAtendimento('2026-11-08', '2026-11-08')).toBeNull();
    expect(validarDataAtendimento('2026-10-09', '2026-11-08')).toBeNull();
  });
  it('recusa futuro e mais de 30 dias', () => {
    expect(validarDataAtendimento('2026-11-09', '2026-11-08')).toMatch(/futuro/);
    expect(validarDataAtendimento('2026-10-08', '2026-11-08')).toMatch(/30 dias/);
  });
  it('conta dias atravessando mês', () => {
    expect(diasEntre('2026-10-31', '2026-11-01')).toBe(1);
  });
});

describe('planoDeCaixa', () => {
  const hoje = '2026-11-08';
  it('comanda normal usa o caixa aberto, ou nenhum', () => {
    expect(
      planoDeCaixa({ dataAtendimento: null, hoje, caixaAbertoAgora: 'c1', caixaDoDia: null }),
    ).toEqual({ tipo: 'USAR', caixaId: 'c1', fechado: false, exigeConfirmacao: false });
    expect(
      planoDeCaixa({ dataAtendimento: null, hoje, caixaAbertoAgora: null, caixaDoDia: null }),
    ).toEqual({ tipo: 'NENHUM' });
  });

  it('dia passado com caixa fechado pede confirmação', () => {
    expect(
      planoDeCaixa({
        dataAtendimento: '2026-11-06',
        hoje,
        caixaAbertoAgora: 'hoje',
        caixaDoDia: { id: 'sexta', status: 'FECHADO', lancadoDepois: false },
      }),
    ).toEqual({ tipo: 'USAR', caixaId: 'sexta', fechado: true, exigeConfirmacao: true });
  });

  it('caixa "lançado depois" do dia não pede confirmação', () => {
    expect(
      planoDeCaixa({
        dataAtendimento: '2026-11-06',
        hoje,
        caixaAbertoAgora: null,
        caixaDoDia: { id: 'auto', status: 'FECHADO', lancadoDepois: true },
      }),
    ).toEqual({ tipo: 'USAR', caixaId: 'auto', fechado: true, exigeConfirmacao: false });
  });

  it('dia passado sem caixa: cria; hoje sem caixa: nenhum', () => {
    expect(
      planoDeCaixa({
        dataAtendimento: '2026-11-06',
        hoje,
        caixaAbertoAgora: 'hoje',
        caixaDoDia: null,
      }),
    ).toEqual({ tipo: 'CRIAR' });
    expect(
      planoDeCaixa({ dataAtendimento: hoje, hoje, caixaAbertoAgora: null, caixaDoDia: null }),
    ).toEqual({ tipo: 'NENHUM' });
  });

  it('comanda de hoje reaberta: caixa aberto agora tem prioridade', () => {
    expect(
      planoDeCaixa({
        dataAtendimento: hoje,
        hoje,
        caixaAbertoAgora: 'novo',
        caixaDoDia: { id: 'velho', status: 'FECHADO', lancadoDepois: false },
      }),
    ).toEqual({ tipo: 'USAR', caixaId: 'novo', fechado: false, exigeConfirmacao: false });
  });
});

describe('ajustarConferencia', () => {
  it('caixa contado: diferença muda', () => {
    expect(
      ajustarConferencia(
        { esperadoCentavos: 10000, contadoCentavos: 10000, lancadoDepois: false },
        3000,
      ),
    ).toEqual({
      esperadoDinheiroCentavos: 13000,
      contadoDinheiroCentavos: 10000,
      diferencaCentavos: -3000,
    });
  });
  it('caixa lançado depois: contado acompanha', () => {
    expect(
      ajustarConferencia(
        { esperadoCentavos: 5000, contadoCentavos: 5000, lancadoDepois: true },
        -2000,
      ),
    ).toEqual({
      esperadoDinheiroCentavos: 3000,
      contadoDinheiroCentavos: 3000,
      diferencaCentavos: 0,
    });
  });
});
