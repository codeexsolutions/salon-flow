import type { NextRequest } from 'next/server';
import { atualizarSessao } from './lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  matcher: [
    // Tudo, exceto arquivos estáticos, imagens, manifests e ícones.
    '/((?!_next/static|_next/image|favicon.ico|manifests/|icons/|sw\\.js$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)',
  ],
};
