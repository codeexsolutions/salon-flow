import { utcParaLocal, localParaUtc } from '../../../shared/domain/data-hora.js';
import { avaliarHorario, horariosLivres, sobrepoe, type Periodo } from './disponibilidade.js';

const FUSO = 'America/Sao_Paulo';
const DATA = '2026-10-05'; // segunda-feira

/** Atalho: "09:00" do dia de teste -> instante UTC */
const as = (hora: string) => localParaUtc(`${DATA}T${hora}`, FUSO);
const periodo = (inicio: string, fim: string): Periodo => ({ inicio: as(inicio), fim: as(fim) });
/** Lista de horários livres como "HH:MM" locais, para facilitar a leitura dos testes. */
const horas = (lista: Date[]) => lista.map((d) => utcParaLocal(d, FUSO).slice(11));

const MANHA_E_TARDE = [
  { inicioMin: 9 * 60, fimMin: 12 * 60 },
  { inicioMin: 13 * 60, fimMin: 15 * 60 },
];

describe('sobrepoe', () => {
  it('considera intervalos semiabertos: encostar não é sobrepor', () => {
    expect(sobrepoe(periodo('09:00', '10:00'), periodo('10:00', '11:00'))).toBe(false);
    expect(sobrepoe(periodo('09:00', '10:01'), periodo('10:00', '11:00'))).toBe(true);
    expect(sobrepoe(periodo('09:00', '12:00'), periodo('10:00', '10:30'))).toBe(true);
  });
});

describe('horariosLivres', () => {
  it('oferece horários a cada 15 min dentro da jornada, respeitando a duração', () => {
    const livres = horariosLivres({
      data: DATA,
      fuso: FUSO,
      jornada: [{ inicioMin: 9 * 60, fimMin: 10 * 60 }],
      ocupados: [],
      duracaoMin: 30,
    });
    expect(horas(livres)).toEqual(['09:00', '09:15', '09:30']);
  });

  it('não atravessa a pausa do almoço', () => {
    const livres = horariosLivres({
      data: DATA,
      fuso: FUSO,
      jornada: MANHA_E_TARDE,
      ocupados: [],
      duracaoMin: 60,
      passoMin: 30,
    });
    expect(horas(livres)).toEqual([
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '13:00',
      '13:30',
      '14:00',
    ]);
  });

  it('pula horários ocupados por agendamentos e folgas', () => {
    const livres = horariosLivres({
      data: DATA,
      fuso: FUSO,
      jornada: [{ inicioMin: 9 * 60, fimMin: 12 * 60 }],
      ocupados: [periodo('09:30', '10:30'), periodo('11:00', '12:00')],
      duracaoMin: 30,
      passoMin: 30,
    });
    expect(horas(livres)).toEqual(['09:00', '10:30']);
  });

  it('não oferece horários no passado', () => {
    const livres = horariosLivres({
      data: DATA,
      fuso: FUSO,
      jornada: [{ inicioMin: 9 * 60, fimMin: 11 * 60 }],
      ocupados: [],
      duracaoMin: 30,
      passoMin: 30,
      naoAntesDe: as('09:40'),
    });
    expect(horas(livres)).toEqual(['10:00', '10:30']);
  });

  it('sem jornada no dia, não há horários', () => {
    expect(
      horariosLivres({ data: DATA, fuso: FUSO, jornada: [], ocupados: [], duracaoMin: 30 }),
    ).toEqual([]);
  });

  it('serviço maior que a faixa não cabe', () => {
    expect(
      horariosLivres({
        data: DATA,
        fuso: FUSO,
        jornada: [{ inicioMin: 9 * 60, fimMin: 10 * 60 }],
        ocupados: [],
        duracaoMin: 90,
      }),
    ).toEqual([]);
  });
});

describe('avaliarHorario', () => {
  const base = { data: DATA, fuso: FUSO, jornada: MANHA_E_TARDE, bloqueios: [], agendamentos: [] };

  it('aceita horário livre dentro da jornada', () => {
    expect(avaliarHorario({ ...base, periodo: periodo('09:00', '10:00') })).toBeNull();
  });

  it('recusa conflito com outro agendamento (prioridade máxima)', () => {
    expect(
      avaliarHorario({
        ...base,
        periodo: periodo('09:00', '10:00'),
        agendamentos: [periodo('09:30', '10:30')],
        bloqueios: [periodo('09:00', '18:00')],
      }),
    ).toBe('CONFLITO');
  });

  it('recusa horário em folga', () => {
    expect(
      avaliarHorario({
        ...base,
        periodo: periodo('09:00', '10:00'),
        bloqueios: [periodo('08:00', '09:30')],
      }),
    ).toBe('BLOQUEADO');
  });

  it('recusa horário fora da jornada ou atravessando o almoço', () => {
    expect(avaliarHorario({ ...base, periodo: periodo('08:00', '09:00') })).toBe('FORA_DA_JORNADA');
    expect(avaliarHorario({ ...base, periodo: periodo('11:30', '12:30') })).toBe('FORA_DA_JORNADA');
    expect(avaliarHorario({ ...base, periodo: periodo('14:30', '15:30') })).toBe('FORA_DA_JORNADA');
  });
});
