import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import type { Env } from '../../config/env.js';
import { NotificacoesRepository } from './notificacoes.repository.js';

export interface MensagemPush {
  titulo: string;
  corpo: string;
  /** Página aberta ao tocar na notificação. */
  url: string;
  /** Mesma tag substitui a notificação anterior no aparelho. */
  tag?: string;
}

/** Envio de push (Web Push / VAPID) para todos os aparelhos do usuário. */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly configurado: boolean;

  constructor(
    private readonly repository: NotificacoesRepository,
    config: ConfigService<Env, true>,
  ) {
    const publica = config.get('VAPID_PUBLIC_KEY', { infer: true });
    const privada = config.get('VAPID_PRIVATE_KEY', { infer: true });
    const assunto = config.get('VAPID_SUBJECT', { infer: true });
    this.chavePublica = publica ?? null;
    this.configurado = !!(publica && privada);
    if (this.configurado) {
      webpush.setVapidDetails(assunto ?? 'mailto:contato@salonflow.app', publica!, privada!);
    } else {
      this.logger.warn('Push desligado: faltam VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY.');
    }
  }

  /** Chave pública para o navegador se inscrever (null = push desligado). */
  readonly chavePublica: string | null;

  get ativo() {
    return this.configurado;
  }

  /** Envia para todos os aparelhos do usuário. Devolve quantos receberam. */
  async enviar(usuarioId: string, mensagem: MensagemPush): Promise<number> {
    if (!this.configurado) return 0;
    const assinaturas = await this.repository.assinaturas(usuarioId);
    const corpo = JSON.stringify(mensagem);
    let entregues = 0;
    await Promise.all(
      assinaturas.map(async (a) => {
        try {
          await webpush.sendNotification(
            { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
            corpo,
            { TTL: 12 * 3600 },
          );
          entregues++;
        } catch (erro) {
          const status = (erro as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            // Aparelho desinscrito ou app removido: a assinatura não vale mais.
            await this.repository.descartarEndpoint(a.endpoint);
          } else {
            this.logger.error(`Falha no push (status ${status ?? '?'})`, erro as Error);
          }
        }
      }),
    );
    return entregues;
  }
}
