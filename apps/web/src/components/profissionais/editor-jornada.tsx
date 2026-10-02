'use client';

import { useActionState, useState } from 'react';
import { DIAS_SEMANA, type IntervaloJornada } from '@salonflow/shared';
import { salvarJornada } from '@/app/admin/(painel)/profissionais/actions';
import type { EstadoForm } from '@/lib/api/estado-form';
import { classeBotaoPrimario, MensagemForm } from '@/components/ui/campo';

type Faixa = { inicio: string; fim: string };
type Semana = Faixa[][];

const PADRAO: Faixa[] = [
  { inicio: '09:00', fim: '12:00' },
  { inicio: '13:00', fim: '18:00' },
];

function paraSemana(jornada: IntervaloJornada[]): Semana {
  const semana: Semana = DIAS_SEMANA.map(() => []);
  jornada.forEach((i) => semana[i.diaSemana].push({ inicio: i.inicio, fim: i.fim }));
  return semana;
}

/** Jornada semanal: cada dia pode ter vários intervalos (ex.: manhã e tarde). */
export function EditorJornada({
  profissionalId,
  jornada,
}: {
  profissionalId: string;
  jornada: IntervaloJornada[];
}) {
  const [semana, setSemana] = useState<Semana>(() => paraSemana(jornada));
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(
    salvarJornada.bind(null, profissionalId),
    {},
  );

  const alterarDia = (dia: number, faixas: Faixa[]) =>
    setSemana((s) => s.map((f, i) => (i === dia ? faixas : f)));

  const copiarParaDiasUteis = (dia: number) =>
    setSemana((s) => s.map((f, i) => (i >= 1 && i <= 5 ? s[dia].map((x) => ({ ...x })) : f)));

  const intervalos: IntervaloJornada[] = semana.flatMap((faixas, diaSemana) =>
    faixas.map((f) => ({ diaSemana, ...f })),
  );

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="intervalos" value={JSON.stringify(intervalos)} />

      {semana.map((faixas, dia) => (
        <div
          key={dia}
          className="flex flex-col gap-2 border-b border-borda pb-3 sm:flex-row sm:items-start"
        >
          <label className="flex w-32 shrink-0 items-center gap-2 pt-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={faixas.length > 0}
              onChange={(e) =>
                alterarDia(dia, e.target.checked ? PADRAO.map((x) => ({ ...x })) : [])
              }
            />
            {DIAS_SEMANA[dia]}
          </label>

          {faixas.length === 0 ? (
            <span className="pt-2 text-sm text-suave">Não trabalha</span>
          ) : (
            <div className="flex flex-1 flex-col gap-2">
              {faixas.map((faixa, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={faixa.inicio}
                    required
                    aria-label={`${DIAS_SEMANA[dia]}: início do intervalo ${i + 1}`}
                    onChange={(e) =>
                      alterarDia(
                        dia,
                        faixas.map((f, j) => (j === i ? { ...f, inicio: e.target.value } : f)),
                      )
                    }
                    className="rounded-md border border-borda bg-transparent px-2 py-1"
                  />
                  <span>até</span>
                  <input
                    type="time"
                    value={faixa.fim}
                    required
                    aria-label={`${DIAS_SEMANA[dia]}: fim do intervalo ${i + 1}`}
                    onChange={(e) =>
                      alterarDia(
                        dia,
                        faixas.map((f, j) => (j === i ? { ...f, fim: e.target.value } : f)),
                      )
                    }
                    className="rounded-md border border-borda bg-transparent px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      alterarDia(
                        dia,
                        faixas.filter((_, j) => j !== i),
                      )
                    }
                    className="px-2 text-suave"
                    aria-label="Remover intervalo"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => alterarDia(dia, [...faixas, { inicio: '', fim: '' }])}
                  className="text-primaria"
                >
                  + intervalo
                </button>
                {dia >= 1 && dia <= 5 && (
                  <button
                    type="button"
                    onClick={() => copiarParaDiasUteis(dia)}
                    className="text-suave underline"
                  >
                    Copiar para seg–sex
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      <MensagemForm sucesso={estado.sucesso} mensagem={estado.mensagem} />

      <button type="submit" disabled={enviando} className={`${classeBotaoPrimario} self-start`}>
        {enviando ? 'Salvando…' : 'Salvar jornada'}
      </button>
    </form>
  );
}
