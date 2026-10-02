'use client';

import { useState, useSyncExternalStore, useTransition } from 'react';
import { Download, EllipsisVertical, Share, SquarePlus, X } from 'lucide-react';
import { classeBotaoPrimario } from '@/components/ui/campo';
import {
  assinarInstalacao,
  conviteDispensadoRecentemente,
  dispensarConvite,
  estadoInstalacao,
  estadoInstalacaoServidor,
  instalarAgora,
} from '@/lib/pwa/instalacao';

/**
 * Convite para instalar o app do cliente. Aparece depois de um agendamento e em
 * "Meus agendamentos" — nunca obriga. Some se o app já estiver instalado ou se o
 * cliente tocar em "Agora não" (volta a aparecer depois de 30 dias).
 */
export function ConviteInstalarApp({ className = '' }: { className?: string }) {
  const estado = useSyncExternalStore(assinarInstalacao, estadoInstalacao, estadoInstalacaoServidor);
  const [fechado, setFechado] = useState(false);
  const [instalando, iniciarInstalacao] = useTransition();

  if (!estado || estado.instalado || fechado || conviteDispensadoRecentemente()) return null;
  // No computador só convida se o navegador permitir instalar com um clique.
  if (estado.plataforma === 'desktop' && !estado.podeInstalarDireto) return null;

  function agoraNao() {
    dispensarConvite();
    setFechado(true);
  }

  return (
    <section
      aria-label="Instalar o app SalonFlow"
      className={`relative flex gap-4 rounded-2xl border border-primaria/25 bg-superficie p-4 text-left shadow-sm ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" className="size-12 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="pr-6">
          <p className="font-medium">Tenha o SalonFlow na tela inicial</p>
          <p className="text-sm text-suave">
            Seus agendamentos a um toque, como um app — sem baixar nada da loja.
          </p>
        </div>

        {estado.podeInstalarDireto ? (
          <button
            type="button"
            disabled={instalando}
            onClick={() => iniciarInstalacao(async () => void (await instalarAgora()))}
            className={`${classeBotaoPrimario} self-start`}
          >
            <Download className="size-4" aria-hidden />
            {instalando ? 'Instalando…' : 'Instalar app'}
          </button>
        ) : estado.plataforma === 'ios' ? (
          <ol className="flex flex-col gap-1.5 text-sm">
            <li className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Passo n={1} /> Toque em <Share className="size-4 text-primaria" aria-label="Compartilhar" />
              <span className="font-medium">Compartilhar</span>
            </li>
            <li className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Passo n={2} /> Escolha
              <SquarePlus className="size-4 text-primaria" aria-hidden />
              <span className="font-medium">Adicionar à Tela de Início</span>
            </li>
          </ol>
        ) : (
          <ol className="flex flex-col gap-1.5 text-sm">
            <li className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Passo n={1} /> Abra o menu
              <EllipsisVertical className="size-4 text-primaria" aria-label="do navegador" />
            </li>
            <li className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Passo n={2} /> Toque em <span className="font-medium">Instalar app</span>
              <span className="text-suave">ou</span>
              <span className="font-medium">Adicionar à tela inicial</span>
            </li>
          </ol>
        )}
      </div>

      <button
        type="button"
        onClick={agoraNao}
        aria-label="Agora não"
        title="Agora não"
        className="absolute top-2 right-2 rounded-full p-1.5 text-suave hover:bg-nude hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
    </section>
  );
}

function Passo({ n }: { n: number }) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-nude text-xs font-medium text-primaria">
      {n}
    </span>
  );
}
