import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DIAS_GUARDAR_NOTIFICACAO } from '@salonflow/shared';
import type { Env } from '../../config/env.js';
import {
  decidirLembrete,
  JANELA_LEMBRETE_HORAS,
  VALIDADE_PEDIDO_AVALIACAO_HORAS,
} from './domain/lembretes.js';
import { NotificacoesRepository } from './notificacoes.repository.js';
import { PushService } from './push.service.js';

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const INTERVALO = 5 * MINUTO;

/** "sáb., 15/11 às 14:00" no fuso do salão. */
function quando(instante: Date, fuso: string) {
  const dia = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fuso,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(instante);
  const hora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fuso,
    hour: '2-digit',
    minute: '2-digit',
  }).format(instante);
  return `${dia} às ${hora}`;
}

/**
 * Pushes automáticos: lembrete de horário e pedido de avaliação. Roda a cada 5
 * minutos só em produção (o ambiente local usa o mesmo banco e não deve enviar).
 * Cada envio é "reservado" no banco antes, então duas instâncias não duplicam.
 */
@Injectable()
export class AgendadorNotificacoes implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(AgendadorNotificacoes.name);
  private timer: NodeJS.Timeout | null = null;
  private rodando = false;

  constructor(
    private readonly repository: NotificacoesRepository,
    private readonly push: PushService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onApplicationBootstrap() {
    if (this.config.get('NODE_ENV', { infer: true }) !== 'production' || !this.push.ativo) return;
    this.timer = setInterval(() => void this.executar(), INTERVALO);
    setTimeout(() => void this.executar(), MINUTO).unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async executar(agora = new Date()) {
    if (this.rodando) return;
    this.rodando = true;
    try {
      await this.lembretes(agora);
      await this.avaliacoes(agora);
      // Caixa de notificações: o que não foi aberto em 5 dias sai do banco.
      await this.repository.apagarNotificacoesAntigas(
        new Date(agora.getTime() - DIAS_GUARDAR_NOTIFICACAO * 24 * HORA),
      );
    } catch (erro) {
      this.logger.error('Falha no agendador de notificações', erro as Error);
    } finally {
      this.rodando = false;
    }
  }

  private async lembretes(agora: Date) {
    const ate = new Date(agora.getTime() + JANELA_LEMBRETE_HORAS * HORA);
    const lista = await this.repository.agendamentosParaLembrete(agora, ate);
    for (const a of lista) {
      const config = a.salao.configMensagens;
      const decisao = decidirLembrete(
        {
          id: a.id,
          inicio: a.inicio,
          criadoEm: a.criadoEm,
          horasAntes: config ? config.lembreteHorasAntes : undefined,
        },
        agora,
      );
      if (decisao === 'AGUARDAR' || !(await this.repository.marcarLembrete(a.id))) continue;
      if (decisao === 'DISPENSAR') continue;
      await this.push.enviar(a.cliente.usuarioId!, {
        titulo: `Lembrete: ${a.servico.nome}`,
        corpo: `${a.salao.nome} · ${quando(a.inicio, a.salao.fusoHorario)} com ${a.profissional.nome}`,
        url: '/meus-agendamentos',
        tag: `lembrete-${a.id}`,
      });
    }
  }

  private async avaliacoes(agora: Date) {
    const desde = new Date(agora.getTime() - VALIDADE_PEDIDO_AVALIACAO_HORAS * HORA);
    const lista = await this.repository.pedidosParaPush(agora, desde);
    for (const a of lista) {
      if (!(await this.repository.marcarPedido(a.id))) continue;
      await this.push.enviar(a.cliente.usuarioId!, {
        titulo: `Como foi no ${a.salao.nome}?`,
        corpo: 'Conte pra gente com uma nota de 1 a 5. Leva menos de 1 minuto.',
        url: `/avaliar/${a.token}`,
        tag: `avaliacao-${a.id}`,
      });
    }
    await this.repository.encerrarPedidosVencidos(desde);
  }
}
