import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';

/** Mensagem para listas vazias e telas ainda não disponíveis. */
export function EstadoVazio({
  titulo,
  descricao,
  icone: Icone = Sparkles,
  acao,
}: {
  titulo: string;
  descricao?: React.ReactNode;
  icone?: LucideIcon;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-borda bg-superficie/60 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-nude text-primaria">
        <Icone className="size-6" aria-hidden />
      </span>
      <div>
        <p className="font-medium">{titulo}</p>
        {descricao && <p className="mt-1 text-sm text-suave">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}
