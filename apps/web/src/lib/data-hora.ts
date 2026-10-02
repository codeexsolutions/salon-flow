/**
 * Datas na tela, sempre no fuso do SALÃO (não no do navegador).
 * Datas "puras" trafegam como AAAA-MM-DD; instantes, como ISO 8601 (UTC).
 */

function partesLocais(instante: Date, fuso: string) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instante);
  return Object.fromEntries(partes.map((p) => [p.type, p.value]));
}

/** Data de hoje no fuso do salão (AAAA-MM-DD). */
export function hojeNoFuso(fuso: string): string {
  const v = partesLocais(new Date(), fuso);
  return `${v.year}-${v.month}-${v.day}`;
}

/** "2026-10-31" + 1 -> "2026-11-01" */
export function somarDias(data: string, dias: number): string {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

/** Minutos desde 00:00 de `data` até o instante, no fuso do salão (pode passar de 1440). */
export function minutosNoDia(iso: string, data: string, fuso: string): number {
  const v = partesLocais(new Date(iso), fuso);
  const diaLocal = `${v.year}-${v.month}-${v.day}`;
  const minutos = Number(v.hour) * 60 + Number(v.minute);
  if (diaLocal === data) return minutos;
  return diaLocal < data ? minutos - 1440 : minutos + 1440;
}

/** Instante ISO -> "HH:MM" no fuso do salão. */
export function horaLocal(iso: string, fuso: string): string {
  const v = partesLocais(new Date(iso), fuso);
  return `${v.hour}:${v.minute}`;
}

/** Instante ISO -> "AAAA-MM-DD" no fuso do salão. */
export function dataLocal(iso: string, fuso: string): string {
  const v = partesLocais(new Date(iso), fuso);
  return `${v.year}-${v.month}-${v.day}`;
}

/** "2026-10-05" -> "Segunda-feira, 5 de outubro" (só a primeira letra maiúscula) */
export function dataPorExtenso(data: string): string {
  const [ano, mes, dia] = data.split('-').map(Number);
  const texto = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(Date.UTC(ano, mes - 1, dia)));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "09:30" -> 570 */
export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** 570 -> "09:30" */
export function minutosParaHora(minutos: number): string {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}
