'use client';

import { useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import { classeBotaoPrimario, classeBotaoSecundario } from '@/components/ui/campo';

/**
 * Mostra o código de recuperação UMA vez. Só libera o botão de continuar depois
 * que a pessoa confirma que guardou (sem o código, não há como recuperar a senha).
 */
export function CodigoRecuperacao({
  codigo,
  usuario,
  rotuloContinuar = 'Continuar',
  aoContinuar,
}: {
  codigo: string;
  usuario?: string;
  rotuloContinuar?: string;
  aoContinuar: () => void;
}) {
  const [guardou, setGuardou] = useState(false);
  const [copiado, setCopiado] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-nude text-primaria">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-2xl">Guarde seu código de recuperação</h2>
          <p className="mt-1 text-sm text-suave">
            Se esquecer a senha, você cria outra com seu usuário, seu celular e este código. Tire
            um print ou anote — ele não aparece de novo.
          </p>
        </div>
      </div>

      <p className="rounded-2xl border-2 border-dashed border-primaria/40 bg-nude py-5 text-center font-mono text-3xl font-semibold tracking-[0.2em] text-primaria select-all">
        {codigo}
      </p>
      {usuario && (
        <p className="-mt-2 text-center text-sm text-suave">
          Seu usuário: <span className="font-medium text-foreground">{usuario}</span>
        </p>
      )}

      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(
            `SalonFlow — código de recuperação${usuario ? ` (usuário ${usuario})` : ''}: ${codigo}`,
          );
          setCopiado(true);
        }}
        className={`${classeBotaoSecundario} self-center`}
      >
        {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copiado ? 'Copiado' : 'Copiar código'}
      </button>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={guardou}
          onChange={(e) => setGuardou(e.target.checked)}
          className="size-4 accent-[var(--primaria)]"
        />
        Já guardei meu código
      </label>
      <button
        type="button"
        disabled={!guardou}
        onClick={aoContinuar}
        className={classeBotaoPrimario}
      >
        {rotuloContinuar}
      </button>
    </div>
  );
}
