import { EstadoVazio } from './ui/estado-vazio';

/** Placeholder das telas que ainda serão implementadas. */
export function EmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return <EstadoVazio titulo={titulo} descricao={descricao} />;
}
