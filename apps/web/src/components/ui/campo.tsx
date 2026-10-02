/** Rótulo + controle + mensagem de ajuda/erro, padrão dos formulários. */
export function Campo({
  rotulo,
  erro,
  ajuda,
  children,
}: {
  rotulo: string;
  erro?: string[];
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{rotulo}</span>
      {children}
      {ajuda && !erro && <span className="text-xs text-suave">{ajuda}</span>}
      {erro && <span className="text-xs text-red-600">{erro[0]}</span>}
    </label>
  );
}

export const classeInput = 'w-full rounded-lg border border-borda bg-transparent px-3 py-2';

export const classeBotaoPrimario =
  'rounded-lg bg-primaria px-4 py-2 font-medium text-primaria-contraste disabled:opacity-60';

export const classeBotaoSecundario = 'rounded-lg border border-borda px-4 py-2 font-medium';

/** Mensagem de retorno de um formulário (sucesso ou erro geral). */
export function MensagemForm({ sucesso, mensagem }: { sucesso?: boolean; mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p
      role={sucesso ? 'status' : 'alert'}
      className={`text-sm ${sucesso ? 'text-green-700' : 'text-red-600'}`}
    >
      {mensagem}
    </p>
  );
}
