/** Link do Google Maps para um endereço (partes vazias são ignoradas). */
export function linkMapa(partes: (string | null | undefined)[]): string | null {
  const endereco = partes.filter(Boolean).join(', ');
  return endereco
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
    : null;
}
