import { pendenciasParaAtivar, validarEncerramento } from './contrato.js';

const testemunha = { nome: 'Maria Souza', cpf: '12345678901' };

describe('contrato de parceria', () => {
  it('lista o que falta para ativar', () => {
    expect(
      pendenciasParaAtivar({
        assinadoEm: null,
        homologacao: null,
        homologadoEm: null,
        testemunhas: [testemunha],
      }),
    ).toHaveLength(3);
    expect(
      pendenciasParaAtivar({
        assinadoEm: '2026-11-10',
        homologacao: 'SINDICATO',
        homologadoEm: '2026-11-12',
        testemunhas: [testemunha, testemunha],
      }),
    ).toEqual([]);
  });

  it('exige 30 dias de aviso prévio, salvo comum acordo', () => {
    const base = { inicioEm: '2026-01-01', avisoPrevioEm: '2026-11-01' };
    expect(() =>
      validarEncerramento({ ...base, encerradoEm: '2026-11-20', comumAcordo: false }),
    ).toThrow(/30 dias/);
    expect(() =>
      validarEncerramento({ ...base, encerradoEm: '2026-12-01', comumAcordo: false }),
    ).not.toThrow();
    expect(() =>
      validarEncerramento({ ...base, encerradoEm: '2026-11-05', comumAcordo: true }),
    ).not.toThrow();
  });

  it('recusa datas fora de ordem', () => {
    expect(() =>
      validarEncerramento({
        inicioEm: '2026-11-01',
        avisoPrevioEm: '2026-10-01',
        encerradoEm: '2026-10-20',
        comumAcordo: true,
      }),
    ).toThrow(/início/);
    expect(() =>
      validarEncerramento({
        inicioEm: '2026-01-01',
        avisoPrevioEm: '2026-11-10',
        encerradoEm: '2026-11-01',
        comumAcordo: true,
      }),
    ).toThrow(/aviso/);
  });
});
