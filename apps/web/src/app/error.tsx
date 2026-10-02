'use client';

import { useEffect } from 'react';

/**
 * Erro inesperado em qualquer tela (ex.: a API fora do ar).
 * Em produção o Next esconde a mensagem técnica; mostramos um texto amigável.
 */
export default function Erro({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const semConexao = /fetch failed|ECONNREFUSED|Failed to fetch/i.test(error.message);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">
        {semConexao ? 'Não foi possível conectar ao servidor' : 'Algo deu errado'}
      </h1>
      <p className="text-sm text-suave">
        {semConexao
          ? 'O serviço está indisponível no momento. Aguarde alguns segundos e tente de novo.'
          : 'Tente novamente. Se o problema continuar, fale com o suporte.'}
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-lg bg-primaria px-4 py-2 font-medium text-primaria-contraste"
      >
        Tentar novamente
      </button>
      {error.digest && <p className="text-xs text-suave">Código: {error.digest}</p>}
    </main>
  );
}
