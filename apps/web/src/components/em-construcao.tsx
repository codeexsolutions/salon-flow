/** Placeholder das telas que ainda serão implementadas. */
export function EmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <section className="rounded-xl border border-dashed border-borda p-8 text-center">
      <h1 className="text-xl font-semibold">{titulo}</h1>
      <p className="mt-2 text-sm text-suave">{descricao}</p>
    </section>
  );
}
