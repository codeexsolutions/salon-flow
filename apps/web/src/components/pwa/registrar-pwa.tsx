'use client';

import { useEffect } from 'react';
import {
  guardarEventoInstalacao,
  marcarInstalado,
  type EventoInstalacao,
} from '@/lib/pwa/instalacao';

/** Registra o service worker e guarda o pedido de instalação do navegador. */
export function RegistrarPwa() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => {
          // Sem HTTPS (ex.: celular pelo IP da rede local) o registro falha: tudo bem.
        });
    }

    function aoPedirInstalacao(evento: Event) {
      // Segura o mini-banner automático: o convite aparece na hora certa.
      evento.preventDefault();
      guardarEventoInstalacao(evento as EventoInstalacao);
    }

    window.addEventListener('beforeinstallprompt', aoPedirInstalacao);
    window.addEventListener('appinstalled', marcarInstalado);
    return () => {
      window.removeEventListener('beforeinstallprompt', aoPedirInstalacao);
      window.removeEventListener('appinstalled', marcarInstalado);
    };
  }, []);

  return null;
}
