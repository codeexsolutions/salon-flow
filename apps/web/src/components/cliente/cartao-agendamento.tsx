'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { formatarPreco, type MeuAgendamento } from '@salonflow/shared';
import { cancelarMeuAgendamento } from '@/app/(cliente)/meus-agendamentos/actions';
import { linkWhatsApp, ROTULO_STATUS } from '@/lib/agenda';
import { dataLocal, dataPorExtenso, horaLocal } from '@/lib/data-hora';

export function CartaoAgendamento({ agendamento: a }: { agendamento: MeuAgendamento }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const fuso = a.salao.fusoHorario;
  const whatsapp = a.salao.telefone && linkWhatsApp(a.salao.telefone);
  const encerrado = !['AGENDADO', 'CONFIRMADO'].includes(a.status);

  function cancelar() {
    if (!confirm('Cancelar este agendamento?')) return;
    iniciar(async () => {
      const r = await cancelarMeuAgendamento(a.id);
      if (r.erro) setErro(r.erro);
    });
  }

  return (
    <li
      className={`flex flex-col gap-1 rounded-xl border border-borda p-4 ${encerrado ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{a.servico.nome}</p>
          <p className="text-sm">
            {dataPorExtenso(dataLocal(a.inicio, fuso))}, às {horaLocal(a.inicio, fuso)}
          </p>
          <p className="text-sm text-suave">
            {a.profissional.nome} ·{' '}
            <Link href={`/s/${a.salao.slug}`} className="underline">
              {a.salao.nome}
            </Link>{' '}
            · {formatarPreco(a.precoCentavos)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-nude px-2 py-0.5 text-xs">
          {ROTULO_STATUS[a.status]}
        </span>
      </div>

      {!encerrado && (
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
          {a.podeCancelar ? (
            <button type="button" onClick={cancelar} disabled={pendente} className="text-perigo">
              {pendente ? 'Cancelando…' : 'Cancelar'}
            </button>
          ) : (
            <span className="text-xs text-suave">Para cancelar agora, fale com o salão.</span>
          )}
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="text-sucesso">
              Falar com o salão
            </a>
          )}
        </div>
      )}
      {erro && (
        <p role="alert" className="text-sm text-perigo">
          {erro}
        </p>
      )}
    </li>
  );
}
