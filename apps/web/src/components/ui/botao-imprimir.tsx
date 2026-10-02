'use client';

import { classeBotaoSecundario } from './campo';

export function BotaoImprimir({ rotulo = 'Imprimir' }: { rotulo?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`${classeBotaoSecundario} print:hidden`}
    >
      {rotulo}
    </button>
  );
}
