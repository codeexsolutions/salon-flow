'use client';

import { Check } from 'lucide-react';
import { CORES_ESTABELECIMENTO } from '@salonflow/shared';
import { temaDoEstabelecimento } from '@/lib/cor-estabelecimento';

/** Escolha da cor da página do estabelecimento, com prévia de botão, chip e capa. */
export function SeletorCor({
  cor,
  aoMudar,
  nome,
}: {
  cor: string;
  aoMudar: (cor: string) => void;
  nome: string;
}) {
  const tema = temaDoEstabelecimento(cor);
  const sugerida = CORES_ESTABELECIMENTO.some((c) => c.cor === cor);

  return (
    <div className="grid gap-5 sm:grid-cols-[1fr_16rem]">
      <div className="flex flex-col gap-3">
        <div role="radiogroup" aria-label="Cores sugeridas" className="flex flex-wrap gap-2">
          {CORES_ESTABELECIMENTO.map((c) => (
            <button
              key={c.cor}
              type="button"
              role="radio"
              aria-checked={cor === c.cor}
              title={c.nome}
              onClick={() => aoMudar(c.cor)}
              className={`flex size-10 items-center justify-center rounded-full border-2 transition ${
                cor === c.cor ? 'border-foreground' : 'border-transparent hover:border-borda'
              }`}
            >
              <span
                className="flex size-8 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: c.cor }}
              >
                {cor === c.cor && <Check className="size-4" aria-hidden />}
              </span>
              <span className="sr-only">{c.nome}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="color"
            value={cor}
            onChange={(e) => aoMudar(e.target.value.toLowerCase())}
            className="h-9 w-12 cursor-pointer rounded-lg border border-borda bg-transparent"
          />
          {sugerida ? 'Ou escolha outra cor' : `Cor personalizada (${cor})`}
        </label>
        <p className="text-xs text-suave">
          Usada nos botões, horários e destaques da sua página. O texto dos botões se ajusta
          sozinho para ficar legível. Grafite é a cor padrão do SalonFlow.
        </p>
      </div>

      <div
        className={`${tema.className ?? ''} overflow-hidden rounded-2xl border border-borda bg-superficie`}
        style={tema.style}
        aria-label="Prévia da sua página"
      >
        <div className="capa-padrao h-14" />
        <div className="flex flex-col gap-2 p-3 pt-0">
          <span className="-mt-5 flex size-10 items-center justify-center rounded-full border-4 border-superficie bg-nude font-display text-primaria">
            {nome.charAt(0).toUpperCase()}
          </span>
          <span className="truncate text-sm font-medium">{nome}</span>
          <div className="flex gap-1.5">
            <span className="rounded-full border border-botao bg-botao px-2.5 py-0.5 text-xs text-botao-contraste">
              09:00
            </span>
            <span className="rounded-full border border-borda px-2.5 py-0.5 text-xs">09:30</span>
            <span className="rounded-full border border-borda px-2.5 py-0.5 text-xs">10:00</span>
          </div>
          <span className="rounded-xl bg-botao px-3 py-2 text-center text-xs font-medium text-botao-contraste">
            Confirmar agendamento
          </span>
          <span className="text-xs font-medium text-primaria">Falar com o estabelecimento</span>
        </div>
      </div>
    </div>
  );
}
