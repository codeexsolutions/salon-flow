'use client';

import { useEffect, useRef } from 'react';

/** Janela modal acessível (usa <dialog> nativo: foco, Esc e fundo escurecido). */
export function Dialogo({
  aberto,
  aoFechar,
  titulo,
  children,
}: {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && aoFechar()}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-borda bg-background p-0 text-foreground backdrop:bg-black/40"
    >
      {aberto && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between border-b border-borda px-5 py-3">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="px-2 text-suave"
            >
              ✕
            </button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
