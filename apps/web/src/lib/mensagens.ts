import 'server-only';
import { CONFIG_MENSAGENS_PADRAO, type ConfigMensagens } from '@salonflow/shared';
import { apiSalao } from '@/lib/api/salao';

/** Modelos de mensagem do salão (padrões se a API ainda não tiver a configuração). */
export function configMensagens(): Promise<ConfigMensagens> {
  return apiSalao<ConfigMensagens>('/mensagens/config').catch(() => CONFIG_MENSAGENS_PADRAO);
}

/** "Ana Paula Lima" -> "Ana" (mensagens mais pessoais). */
export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome;
