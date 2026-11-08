/** Versão do deploy que está no ar (o aviso de nova versão compara com a do navegador). */
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { versao: process.env.NEXT_PUBLIC_VERSAO ?? 'dev' },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
