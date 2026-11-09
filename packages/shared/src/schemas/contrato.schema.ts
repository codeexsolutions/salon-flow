import { z } from 'zod';

/**
 * Contrato de parceria (Lei 13.352/2016, que alterou a Lei 12.592/2012).
 * O salão-parceiro centraliza os pagamentos e retém a cota-parte dele; o
 * profissional-parceiro recebe a cota-parte dele, sem vínculo de emprego.
 */

export const FUNCOES_PARCEIRO = [
  'CABELEIREIRO',
  'BARBEIRO',
  'ESTETICISTA',
  'MANICURE',
  'PEDICURE',
  'DEPILADOR',
  'MAQUIADOR',
] as const;
export type FuncaoParceiro = (typeof FUNCOES_PARCEIRO)[number];

export const ROTULO_FUNCAO_PARCEIRO: Record<FuncaoParceiro, string> = {
  CABELEIREIRO: 'Cabeleireiro(a)',
  BARBEIRO: 'Barbeiro(a)',
  ESTETICISTA: 'Esteticista',
  MANICURE: 'Manicure',
  PEDICURE: 'Pedicure',
  DEPILADOR: 'Depilador(a)',
  MAQUIADOR: 'Maquiador(a)',
};

export const PERIODICIDADES_REPASSE = ['SEMANAL', 'QUINZENAL', 'MENSAL'] as const;
export type PeriodicidadeRepasse = (typeof PERIODICIDADES_REPASSE)[number];

export const ROTULO_PERIODICIDADE: Record<PeriodicidadeRepasse, string> = {
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
};

export const HOMOLOGACOES = ['SINDICATO', 'MTE'] as const;
export type Homologacao = (typeof HOMOLOGACOES)[number];

export const ROTULO_HOMOLOGACAO: Record<Homologacao, string> = {
  SINDICATO: 'Sindicato da categoria',
  MTE: 'Órgão local do Ministério do Trabalho',
};

export type StatusContrato = 'RASCUNHO' | 'ATIVO' | 'ENCERRADO';

/** Aviso prévio mínimo para rescisão unilateral (Lei 12.592, art. 1º-A, § 10, V). */
export const AVISO_PREVIO_DIAS = 30;

/** Tamanho máximo do PDF do contrato assinado. */
export const TAMANHO_MAXIMO_CONTRATO_BYTES = 5 * 1024 * 1024;

const soDigitos = (v: string) => v.replace(/\D/g, '');
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');
const texto = (max: number) => z.string().trim().max(max);

/** CPF (11 dígitos) ou CNPJ (14 dígitos), guardado só com números. */
const documento = z
  .string()
  .transform(soDigitos)
  .refine((v) => v.length === 11 || v.length === 14, 'Informe um CPF ou CNPJ válido');
const cpf = z
  .string()
  .transform(soDigitos)
  .refine((v) => v.length === 11, 'Informe um CPF válido');

export const testemunhaSchema = z.object({
  nome: texto(120).min(3, 'Informe o nome da testemunha'),
  cpf,
});
export type Testemunha = z.infer<typeof testemunhaSchema>;

export const contratoSchema = z.object({
  profissionalId: z.uuid('Escolha o profissional'),
  salaoRazaoSocial: texto(160).min(2, 'Informe a razão social (ou nome) do salão'),
  salaoDocumento: documento,
  salaoEndereco: texto(300).min(5, 'Informe o endereço do salão'),
  profissionalNome: texto(120).min(3, 'Informe o nome completo do profissional'),
  profissionalDocumento: documento,
  profissionalMei: z.boolean(),
  profissionalEndereco: texto(300).min(5, 'Informe o endereço do profissional'),
  funcoes: z.array(z.enum(FUNCOES_PARCEIRO)).min(1, 'Marque ao menos uma função').max(7),
  /** Serviços que o profissional-parceiro presta pelo contrato. */
  servicoIds: z.array(z.uuid()).max(300),
  /** Cota-parte do profissional sobre cada serviço (o resto é a cota do salão). */
  cotaProfissionalBps: z.number().int().min(0).max(10_000),
  periodicidade: z.enum(PERIODICIDADES_REPASSE),
  inicioEm: data,
  // Formalização (pode ser preenchida depois de gerar e assinar).
  assinadoEm: data.nullable().default(null),
  homologacao: z.enum(HOMOLOGACOES).nullable().default(null),
  homologadoEm: data.nullable().default(null),
  testemunhas: z.array(testemunhaSchema).max(2).default([]),
});
export type ContratoInput = z.infer<typeof contratoSchema>;

export const encerrarContratoSchema = z.object({
  avisoPrevioEm: data,
  encerradoEm: data,
  /** Rescisão de comum acordo dispensa os 30 dias de aviso. */
  comumAcordo: z.boolean().default(false),
  motivo: texto(300).min(3, 'Informe o motivo do encerramento'),
});
export type EncerrarContratoInput = z.infer<typeof encerrarContratoSchema>;

export interface ContratoResumo {
  id: string;
  profissionalId: string;
  profissionalNome: string;
  status: StatusContrato;
  inicioEm: string;
  encerradoEm: string | null;
  temArquivo: boolean;
  /** Pendências para ativar (vazia = pode ativar). */
  pendencias: string[];
  criadoEm: string;
}

export interface ContratoDetalhe extends Omit<ContratoInput, 'testemunhas'> {
  id: string;
  status: StatusContrato;
  testemunhas: Testemunha[];
  servicos: { id: string; nome: string }[];
  temArquivo: boolean;
  arquivoNome: string | null;
  avisoPrevioEm: string | null;
  encerradoEm: string | null;
  comumAcordo: boolean;
  motivoEncerramento: string | null;
  pendencias: string[];
  salaoNome: string;
  criadoEm: string;
}

/** Profissional ativo e a situação do contrato dele (lista da página Contratos). */
export interface SituacaoContrato {
  profissionalId: string;
  nome: string;
  /** Contrato vigente (ativo) ou, sem ele, o mais recente. */
  contrato: ContratoResumo | null;
}

/** Dados sugeridos para um contrato novo (salão do último contrato, comissão etc.). */
export type SugestaoContrato = Omit<ContratoInput, 'testemunhas'> & { testemunhas: Testemunha[] };

export function formatarDocumento(doc: string): string {
  const d = soDigitos(doc);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return doc;
}
