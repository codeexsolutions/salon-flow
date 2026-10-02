/** Bloco com título das páginas de detalhe do painel. */
export function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-borda p-5">
      <div>
        <h2 className="text-lg font-semibold">{titulo}</h2>
        {descricao && <p className="text-sm text-suave">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}
