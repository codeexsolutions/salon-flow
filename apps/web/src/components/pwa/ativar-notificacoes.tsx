'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { cancelarPush, inscreverPush } from '@/lib/push/actions';

type Estado =
  | 'carregando'
  | 'sem-suporte'
  /** iPhone/iPad: push só com o app instalado na tela de início. */
  | 'instalar-ios'
  | 'bloqueado'
  | 'desativado'
  | 'ativado';

/** Chave VAPID (base64 url) -> bytes, como o PushManager pede. */
function paraBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

const ehIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const instalado = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Ativa/desativa as notificações (lembrete de horário e pedido de avaliação)
 * neste aparelho. Some quando o push não está disponível.
 */
export function AtivarNotificacoes({
  chavePublica,
  className = '',
}: {
  chavePublica: string | null;
  className?: string;
}) {
  const [estado, setEstado] = useState<Estado>('carregando');
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  useEffect(() => {
    let ativo = true;
    async function verificar() {
      if (!chavePublica || !('serviceWorker' in navigator)) return 'sem-suporte';
      if (!('PushManager' in window) || !('Notification' in window)) {
        return ehIos() && !instalado() ? 'instalar-ios' : 'sem-suporte';
      }
      if (Notification.permission === 'denied') return 'bloqueado';
      const registro = await navigator.serviceWorker.ready;
      const assinatura = await registro.pushManager.getSubscription();
      return assinatura && Notification.permission === 'granted' ? 'ativado' : 'desativado';
    }
    verificar()
      .then((e) => ativo && setEstado(e))
      .catch(() => ativo && setEstado('sem-suporte'));
    return () => {
      ativo = false;
    };
  }, [chavePublica]);

  function ativar() {
    setErro(null);
    iniciar(async () => {
      try {
        const permissao = await Notification.requestPermission();
        if (permissao !== 'granted') {
          setEstado(permissao === 'denied' ? 'bloqueado' : 'desativado');
          return;
        }
        const registro = await navigator.serviceWorker.ready;
        const assinatura =
          (await registro.pushManager.getSubscription()) ??
          (await registro.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: paraBytes(chavePublica!),
          }));
        const r = await inscreverPush(assinatura.toJSON());
        if (!r.ok) {
          setErro(r.erro);
          return;
        }
        setEstado('ativado');
      } catch {
        setErro('Não foi possível ativar as notificações neste aparelho.');
      }
    });
  }

  function desativar() {
    setErro(null);
    iniciar(async () => {
      const registro = await navigator.serviceWorker.ready;
      const assinatura = await registro.pushManager.getSubscription();
      if (assinatura) {
        await cancelarPush(assinatura.endpoint);
        await assinatura.unsubscribe();
      }
      setEstado('desativado');
    });
  }

  if (estado === 'carregando' || estado === 'sem-suporte') return null;

  const caixa = `flex flex-col gap-2 rounded-xl border border-borda bg-superficie p-4 text-sm ${className}`;

  if (estado === 'instalar-ios') {
    return (
      <div className={caixa}>
        <p className="flex items-center gap-2 font-medium">
          <Bell className="size-4 text-primaria" aria-hidden /> Quer receber lembretes do horário?
        </p>
        <p className="text-suave">
          No iPhone, adicione o app à tela de início (Compartilhar → Adicionar à Tela de Início) e
          abra por lá para ativar as notificações.
        </p>
      </div>
    );
  }

  if (estado === 'bloqueado') {
    return (
      <div className={caixa}>
        <p className="flex items-center gap-2 font-medium">
          <BellOff className="size-4 text-suave" aria-hidden /> Notificações bloqueadas
        </p>
        <p className="text-suave">
          Para receber lembretes, libere as notificações deste site nas configurações do navegador.
        </p>
      </div>
    );
  }

  return (
    <div className={caixa}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2">
          {estado === 'ativado' ? (
            <>
              <Bell className="size-4 text-sucesso" aria-hidden />
              Notificações ativadas neste aparelho
            </>
          ) : (
            <>
              <Bell className="size-4 text-primaria" aria-hidden />
              Receba o lembrete do seu horário
            </>
          )}
        </p>
        <button
          type="button"
          onClick={estado === 'ativado' ? desativar : ativar}
          disabled={pendente}
          className={
            estado === 'ativado'
              ? 'text-xs text-suave underline'
              : 'rounded-xl bg-botao px-4 py-2 text-sm font-medium text-botao-contraste hover:bg-botao-hover disabled:opacity-60'
          }
        >
          {pendente ? 'Aguarde…' : estado === 'ativado' ? 'Desativar' : 'Ativar notificações'}
        </button>
      </div>
      {erro && <p className="text-xs text-perigo">{erro}</p>}
    </div>
  );
}
