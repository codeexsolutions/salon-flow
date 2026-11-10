import { z } from 'zod';

export const criarClienteSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().max(20).optional(),
  email: z.email('E-mail inválido').trim().toLowerCase().optional(),
  observacoes: z.string().trim().max(500).optional(),
  /** AAAA-MM-DD */
  nascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional(),
  recebeNotificacoes: z.boolean().optional(),
});
export type CriarClienteInput = z.infer<typeof criarClienteSchema>;

export interface ClienteResumo {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  /** Cliente tem conta no app (agenda sozinho). */
  usaApp: boolean;
}

/** Texto opcional: vazio vira null. */
const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable();

export const atualizarClienteSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  telefone: textoOpcional(20),
  email: z
    .union([z.literal(''), z.email('E-mail inválido').trim().toLowerCase()])
    .transform((v) => v || null)
    .nullable(),
  observacoes: textoOpcional(500),
  nascimento: z
    .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')])
    .transform((v) => v || null)
    .nullable(),
  recebeNotificacoes: z.boolean(),
});
export type AtualizarClienteInput = z.infer<typeof atualizarClienteSchema>;

/** Registro da ficha técnica do cliente (o que foi feito no atendimento). */
export const anotacaoClienteSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  texto: z.string().trim().min(2, 'Escreva o que foi feito').max(2000),
  servicoId: z.uuid().nullable().optional(),
  profissionalId: z.uuid().nullable().optional(),
});
export type AnotacaoClienteInput = z.infer<typeof anotacaoClienteSchema>;

export interface AnotacaoCliente {
  id: string;
  /** AAAA-MM-DD */
  data: string;
  texto: string;
  servico: { id: string; nome: string } | null;
  profissional: { id: string; nome: string } | null;
  autorId: string | null;
  /** Quem está vendo pode editar/excluir (autor ou dono). */
  podeEditar: boolean;
  criadoEm: string;
}

/** Números do cliente no salão (comandas fechadas e agendamentos). */
export interface IndicadoresCliente {
  totalGastoCentavos: number;
  visitas: number;
  ticketMedioCentavos: number;
  /** AAAA-MM-DD (data do atendimento) ou null se nunca veio. */
  primeiraVisita: string | null;
  ultimaVisita: string | null;
  /** Dias desde a última visita (null se nunca veio). */
  diasSemVir: number | null;
  faltas: number;
  cancelamentos: number;
}

export interface ClienteNaLista extends IndicadoresCliente {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  usaApp: boolean;
  /** AAAA-MM-DD */
  nascimento: string | null;
  recebeNotificacoes: boolean;
  criadoEm: string;
}

export interface AtendimentoCliente {
  comandaId: string;
  numero: number;
  /** AAAA-MM-DD */
  data: string;
  totalCentavos: number;
  itens: { descricao: string; profissional: string | null; valorCentavos: number }[];
}

export interface ProximoAgendamentoCliente {
  id: string;
  inicio: string;
  servico: string;
  profissional: string;
}

export interface ClienteDetalhe extends ClienteNaLista {
  observacoes: string | null;
  atendimentos: AtendimentoCliente[];
  proximosAgendamentos: ProximoAgendamentoCliente[];
  servicosPreferidos: { nome: string; vezes: number }[];
  profissionaisPreferidos: { nome: string; vezes: number }[];
  anotacoes: AnotacaoCliente[];
}

/** Ficha técnica vista pelo profissional no app (sem valores gastos). */
export interface FichaClientePro {
  cliente: { id: string; nome: string; telefone: string | null; observacoes: string | null };
  anotacoes: AnotacaoCliente[];
  servicos: { id: string; nome: string }[];
}
