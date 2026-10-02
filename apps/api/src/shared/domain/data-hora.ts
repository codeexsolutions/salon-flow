/**
 * Conversões de data/hora entre o horário local do salão e UTC.
 * Funções puras (sem Nest/Prisma), usadas por agenda, jornada e folgas.
 */

/** Diferença, em minutos, entre o horário local do fuso e UTC naquele instante. */
function deslocamentoMin(fuso: string, instante: number): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: fuso,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instante));
  const v = Object.fromEntries(partes.map((p) => [p.type, Number(p.value)]));
  const comoUtc = Date.UTC(v.year, v.month - 1, v.day, v.hour, v.minute, v.second);
  return Math.round((comoUtc - Math.floor(instante / 1000) * 1000) / 60_000);
}

/**
 * "2026-10-02T09:30" no fuso do salão -> instante UTC.
 * Ex.: localParaUtc('2026-10-02T09:30', 'America/Sao_Paulo') = 2026-10-02T12:30Z
 */
export function localParaUtc(local: string, fuso: string): Date {
  const [data, hora] = local.split('T');
  const [ano, mes, dia] = data.split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  const palpite = Date.UTC(ano, mes - 1, dia, h, min);

  // Duas passadas para acertar instantes perto de mudança de horário de verão.
  let utc = palpite - deslocamentoMin(fuso, palpite) * 60_000;
  const ajuste = deslocamentoMin(fuso, utc);
  utc = palpite - ajuste * 60_000;
  return new Date(utc);
}

/** "09:30" -> 570 */
export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** 570 -> "09:30" */
export function minutosParaHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
