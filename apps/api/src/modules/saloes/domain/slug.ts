/**
 * Camada de DOMÍNIO: funções puras, sem Nest, sem Prisma, sem HTTP.
 * Fáceis de testar e o lugar certo para regras de negócio.
 */

/** "Studio Bela Vista & Cia" -> "studio-bela-vista-cia" */
export function gerarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}
