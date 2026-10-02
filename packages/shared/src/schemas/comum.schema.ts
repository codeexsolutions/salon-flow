import { z } from 'zod';

/** Data local do salão: AAAA-MM-DD (como vem de <input type="date">). */
export const dataLocalSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

/** Data e hora locais do salão: AAAA-MM-DDTHH:MM (como vem de <input type="datetime-local">). */
export const dataHoraLocalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Use o formato AAAA-MM-DDTHH:MM');
