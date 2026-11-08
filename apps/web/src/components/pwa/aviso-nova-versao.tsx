'use client';

import { useEffect, useState } from 'react';

const VERSAO_ATUAL = process.env.NEXT_PUBLIC_VERSAO ?? 'dev';
const INTERVALO_MS = 5 * 60 * 1000;

/**
 * Aviso de nova versão: de tempos em tempos (e ao voltar para a aba) pergunta ao
 * servidor qual deploy está no ar; se for outro, convida a recarregar a página.
 */
export function AvisoNovaVersao() {
  const [novaVersao, setNovaVersao] = useState(false);

  useEffect(() => {
    if (VERSAO_ATUAL === 'dev') return;
    let parar = false;

    async function verificar() {
      if (parar || document.visibilityState !== 'visible') return;
      try {
        const resposta = await fetch('/versao', { cache: 'no-store' });
        if (!resposta.ok) return;
        const { versao } = (await resposta.json()) as { versao?: string };
        if (versao && versao !== 'dev' && versao !== VERSAO_ATUAL) {
          setNovaVersao(true);
          parar = true;
        }
      } catch {
        // Sem rede: tenta de novo depois.
      }
    }

    const intervalo = setInterval(verificar, INTERVALO_MS);
    document.addEventListener('visibilitychange', verificar);
    window.addEventListener('focus', verificar);
    return () => {
      parar = true;
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', verificar);
      window.removeEventListener('focus', verificar);
    };
  }, []);

  if (!novaVersao) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-borda bg-superficie px-4 py-3 text-sm shadow-lg"
    >
      <span className="flex-1">
        <span className="font-semibold">Nova versão do SalonFlow disponível.</span>{' '}
        <span className="text-suave">Atualize para usar as novidades.</span>
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-xl bg-primaria px-3 py-2 font-medium text-primaria-contraste"
      >
        Atualizar
      </button>
      <button
        type="button"
        onClick={() => setNovaVersao(false)}
        aria-label="Fechar aviso"
        className="px-1 text-suave"
      >
        ✕
      </button>
    </div>
  );
}
