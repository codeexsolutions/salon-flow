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
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{rotulo}</span>
      {children}
      {ajuda && !erro && <span className="text-xs text-suave">{ajuda}</span>}
      {erro && <span className="text-xs text-perigo">{erro[0]}</span>}
    </label>
  );
}

export const classeInput =
  'w-full rounded-xl border border-borda bg-superficie px-3.5 py-2.5 text-foreground placeholder:text-suave/70 transition focus:border-primaria focus:ring-2 focus:ring-primaria/20 focus:outline-none disabled:opacity-60';

const baseBotao =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60';

export const classeBotaoPrimario = `${baseBotao} bg-primaria text-primaria-contraste shadow-sm hover:bg-primaria-hover`;

export const classeBotaoSecundario = `${baseBotao} border border-borda bg-superficie text-foreground hover:border-primaria/40 hover:bg-nude`;

export const classeBotaoPerigo = `${baseBotao} border border-perigo/30 bg-superficie text-perigo hover:bg-perigo-suave`;

/** Mensagem de retorno de um formulário (sucesso ou erro geral). */
export function MensagemForm({ sucesso, mensagem }: { sucesso?: boolean; mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p
      role={sucesso ? 'status' : 'alert'}
      className={`rounded-lg px-3 py-2 text-sm ${
        sucesso ? 'bg-sucesso-suave text-sucesso' : 'bg-perigo-suave text-perigo'
      }`}
    >
      {mensagem}
    </p>
  );
}
