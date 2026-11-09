import { quemFazOServico } from './quem-faz.js';

const ativos = [
  { id: 'ana', nome: 'Ana' },
  { id: 'bia', nome: 'Bia' },
];

describe('quemFazOServico', () => {
  it('sem ninguém marcado, todos os profissionais ativos fazem (valores do serviço)', () => {
    expect(quemFazOServico(0, [], ativos)).toEqual([
      { profissionalId: 'ana', nome: 'Ana', precoCentavos: null, duracaoMin: null },
      { profissionalId: 'bia', nome: 'Bia', precoCentavos: null, duracaoMin: null },
    ]);
  });

  it('com marcados, só os marcados ativos', () => {
    const bia = { profissionalId: 'bia', nome: 'Bia', precoCentavos: 5000, duracaoMin: null };
    expect(quemFazOServico(1, [bia], ativos)).toEqual([bia]);
  });

  it('marcados todos desativados: ninguém (não vira "todos")', () => {
    expect(quemFazOServico(2, [], ativos)).toEqual([]);
  });
});
