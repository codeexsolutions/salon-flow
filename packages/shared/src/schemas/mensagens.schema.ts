import { z } from 'zod';

// ---- Modelos de mensagem do WhatsApp ----

export const MODELOS_MENSAGEM = ['lembrete', 'avaliacao', 'aniversario', 'saudade'] as const;
export type ModeloMensagem = (typeof MODELOS_MENSAGEM)[number];

export const ROTULO_MODELO: Record<ModeloMensagem, { rotulo: string; variaveis: string[] }> = {
  lembrete: {
    rotulo: 'Lembrete de horário',
    variaveis: ['nome', 'salao', 'servico', 'profissional', 'data', 'hora'],
  },
  avaliacao: { rotulo: 'Pedido de avaliação', variaveis: ['nome', 'salao', 'link'] },
  aniversario: { rotulo: 'Aniversário', variaveis: ['nome', 'salao', 'link'] },
  saudade: { rotulo: 'Estamos com saudade', variaveis: ['nome', 'salao', 'link'] },
};

export const MODELOS_PADRAO: Record<ModeloMensagem, string> = {
  lembrete:
    'Olá, {nome}! Passando para lembrar do seu horário no {salao}: {servico} com {profissional}, {data} às {hora}. Até lá!',
  avaliacao:
    'Olá, {nome}! Obrigado pela visita ao {salao}. Pode nos contar como foi? Leva menos de 1 minuto: {link}',
  aniversario:
    'Feliz aniversário, {nome}! 🎉 Toda a equipe do {salao} deseja um dia lindo. Venha comemorar com a gente: {link}',
  saudade:
    'Oi, {nome}! Estamos com saudade de você aqui no {salao}. Que tal agendar um horário? {link}',
};

/** Troca {variavel} pelo valor (variável sem valor some). */
export function montarMensagem(
  modelo: string,
  variaveis: Record<string, string | null | undefined>,
) {
  return modelo
    .replace(/\{(\w+)\}/g, (_, chave: string) => variaveis[chave] ?? '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Número no formato do WhatsApp (só dígitos, com DDI). Sem DDI = Brasil. */
export function numeroWhatsApp(telefone: string | null | undefined): string | null {
  const digitos = telefone?.replace(/\D/g, '') ?? '';
  if (digitos.length < 10) return null;
  return digitos.length <= 11 ? `55${digitos}` : digitos;
}

/** Link do WhatsApp com o texto pronto (null se o telefone não serve). */
export function linkWhatsApp(telefone: string | null | undefined, texto?: string): string | null {
  const numero = numeroWhatsApp(telefone);
  if (!numero) return null;
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

/** Link do WhatsApp Web (computador), com o texto pronto. */
export function linkWhatsAppWeb(
  telefone: string | null | undefined,
  texto?: string,
): string | null {
  const numero = numeroWhatsApp(telefone);
  if (!numero) return null;
  return `https://web.whatsapp.com/send?phone=${numero}${texto ? `&text=${encodeURIComponent(texto)}` : ''}`;
}

// ---- Configuração ----

const horas = z.number().int().min(1).max(72).nullable();

export const configMensagensSchema = z.object({
  lembreteHorasAntes: horas,
  avaliacaoHorasDepois: horas,
  modelos: z.object(
    Object.fromEntries(MODELOS_MENSAGEM.map((m) => [m, z.string().trim().max(1000)])) as Record<
      ModeloMensagem,
      z.ZodString
    >,
  ),
});
export type ConfigMensagensInput = z.infer<typeof configMensagensSchema>;

/** Configuração efetiva (padrões preenchidos). */
export interface ConfigMensagens {
  lembreteHorasAntes: number | null;
  avaliacaoHorasDepois: number | null;
  modelos: Record<ModeloMensagem, string>;
}

export const CONFIG_MENSAGENS_PADRAO: ConfigMensagens = {
  lembreteHorasAntes: 24,
  avaliacaoHorasDepois: 2,
  modelos: MODELOS_PADRAO,
};

// ---- Push ----

export const assinaturaPushSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});
export type AssinaturaPushInput = z.infer<typeof assinaturaPushSchema>;

export const cancelarPushSchema = z.object({ endpoint: z.url().max(1000) });

// ---- Avaliações ----

export const responderAvaliacaoSchema = z.object({
  nota: z.number().int().min(1, 'Escolha de 1 a 5 estrelas').max(5),
  comentario: z
    .string()
    .trim()
    .max(1000)
    .transform((v) => v || null)
    .nullable()
    .optional(),
});
export type ResponderAvaliacaoInput = z.infer<typeof responderAvaliacaoSchema>;

/** Página pública de avaliação (aberta pelo link do push ou do WhatsApp). */
export interface AvaliacaoPublica {
  salao: { nome: string; slug: string; logoUrl: string | null };
  /** AAAA-MM-DD */
  data: string;
  itens: { descricao: string; profissional: string | null }[];
  nota: number | null;
  comentario: string | null;
  respondida: boolean;
}

export interface AvaliacaoNaLista {
  id: string;
  /** AAAA-MM-DD (atendimento) */
  data: string;
  cliente: { id: string; nome: string };
  comandaId: string;
  nota: number;
  comentario: string | null;
  profissionais: string[];
}

export interface RelatorioAvaliacoes {
  /** Média das notas no período (null = nenhuma). */
  media: number | null;
  respondidas: number;
  /** Pedidos no período (comandas fechadas com cliente). */
  pedidas: number;
  /** Quantas notas 1..5 (índice 0 = nota 1). */
  distribuicao: number[];
  porProfissional: { nome: string; media: number; total: number }[];
  recentes: AvaliacaoNaLista[];
}

/** Link de avaliação de uma comanda (para o botão do WhatsApp). */
export interface LinkAvaliacao {
  token: string;
  respondida: boolean;
}

// ---- Envio manual de push (tela Mensagens → Enviar) ----

export const TAMANHO_TITULO_PUSH = 65;
export const TAMANHO_MENSAGEM_PUSH = 240;

export const enviarPushSchema = z.object({
  /** 'TODOS' = clientes do salão com notificações ativas; senão, o id do cliente. */
  destino: z.union([z.literal('TODOS'), z.uuid()]),
  titulo: z.string().trim().min(2, 'Escreva o título').max(TAMANHO_TITULO_PUSH),
  mensagem: z.string().trim().min(2, 'Escreva a mensagem').max(TAMANHO_MENSAGEM_PUSH),
  /** Página aberta ao tocar: caminho do site (/s/...) ou https://... */
  url: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => v === '' || v.startsWith('/') || /^https:\/\//.test(v),
      'Use /caminho ou https://',
    )
    .transform((v) => v || null)
    .nullable(),
});
export type EnviarPushInput = z.infer<typeof enviarPushSchema>;

export interface ResultadoEnvioPush {
  /** Clientes que tinham notificações ativas. */
  clientes: number;
  /** Aparelhos que receberam. */
  entregues: number;
}

export interface AssinantePush {
  clienteId: string;
  nome: string;
  telefone: string | null;
  aparelhos: number;
}

// ---- Caixa de notificações (sino do app) ----

/** Notificação não aberta é apagada depois deste prazo. */
export const DIAS_GUARDAR_NOTIFICACAO = 5;

export interface NotificacaoDto {
  id: string;
  titulo: string;
  corpo: string;
  criadoEm: string;
}
