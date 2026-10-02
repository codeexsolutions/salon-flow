'use client';

import { useActionState, useRef } from 'react';
import type { BloqueioAgenda } from '@salonflow/shared';
import { criarBloqueio, removerBloqueio } from '@/app/admin/(painel)/profissionais/actions';
import type { EstadoForm } from '@/lib/api/estado-form';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';

/** Folgas, férias e compromissos (atuais e futuros) + formulário para adicionar. */
export function Folgas({
  profissionalId,
  bloqueios,
  fusoHorario,
}: {
  profissionalId: string;
  bloqueios: BloqueioAgenda[];
  fusoHorario: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(
    async (anterior, formData) => {
      const resultado = await criarBloqueio(profissionalId, anterior, formData);
      if (resultado.sucesso) form.current?.reset();
      return resultado;
    },
    {},
  );

  const formatar = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoHorario,
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="flex flex-col gap-4">
      {bloqueios.length === 0 ? (
        <p className="text-sm text-suave">Nenhuma folga programada.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda bg-superficie">
          {bloqueios.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span>
                {formatar.format(new Date(b.inicio))} → {formatar.format(new Date(b.fim))}
                {b.motivo && <span className="text-suave"> · {b.motivo}</span>}
              </span>
              <button
                type="button"
                onClick={() => removerBloqueio(profissionalId, b.id)}
                className="text-xs text-perigo"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <form ref={form} action={acao} className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Início" erro={estado.erros?.inicio}>
          <input name="inicio" type="datetime-local" required className={classeInput} />
        </Campo>
        <Campo rotulo="Fim" erro={estado.erros?.fim}>
          <input name="fim" type="datetime-local" required className={classeInput} />
        </Campo>
        <div className="sm:col-span-2">
          <Campo rotulo="Motivo (opcional)" erro={estado.erros?.motivo}>
            <input name="motivo" placeholder="Férias, consulta médica…" className={classeInput} />
          </Campo>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <MensagemForm sucesso={estado.sucesso} mensagem={estado.mensagem} />
          <button type="submit" disabled={enviando} className={`${classeBotaoPrimario} self-start`}>
            {enviando ? 'Adicionando…' : 'Adicionar folga'}
          </button>
        </div>
      </form>
    </div>
  );
}
