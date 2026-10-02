/** Cartão com título das páginas de detalhe do painel. */
export function Secao({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string;
  descricao?: string;
  /** Botões/links no canto do título. */
  acoes?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-5 shadow-[0_1px_2px_rgb(58_42_43/0.04)] print:border-0 print:p-0 print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{titulo}</h2>
          {descricao && <p className="mt-0.5 text-sm text-suave">{descricao}</p>}
        </div>
        {acoes}
      </div>
      {children}
    </section>
  );
}
