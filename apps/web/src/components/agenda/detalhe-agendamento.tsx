'use client';

import { useState, useTransition } from 'react';
import {
  formatarPreco,
  type AgendamentoAgenda,
  type ProfissionalNaAgenda,
} from '@salonflow/shared';
import { alterarStatusAgendamento, remarcarAgendamento } from '@/app/admin/(painel)/agenda/actions';
import { ACOES_STATUS, linkWhatsApp, ROTULO_STATUS } from '@/lib/agenda';
import { dataLocal, dataPorExtenso, horaLocal } from '@/lib/data-hora';
import { classeBotaoPrimario, classeBotaoSecundario, classeInput } from '@/components/ui/campo';

/** Detalhes de um atendimento: contato, status e remarcação. */
export function DetalheAgendamento({
  agendamento,
  profissionais,
  fusoHorario,
  aoConcluir,
}: {
  agendamento: AgendamentoAgenda;
  profissionais: ProfissionalNaAgenda[];
  fusoHorario: string;
  aoConcluir: () => void;
}) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [remarcando, setRemarcando] = useState(false);

  const profissional = profissionais.find((p) => p.id === agendamento.profissionalId);
  const whatsapp = agendamento.cliente.telefone && linkWhatsApp(agendamento.cliente.telefone);
  const acoes = ACOES_STATUS[agendamento.status];

  function mudarStatus(status: (typeof acoes)[number]['status']) {
    if (status === 'CANCELADO' && !confirm('Cancelar este agendamento?')) return;
    setErro(null);
    iniciar(async () => {
      const r = await alterarStatusAgendamento(agendamento.id, status);
      if (r.ok) aoConcluir();
      else setErro(r.erro);
    });
  }

  function remarcar(formData: FormData) {
    setErro(null);
    iniciar(async () => {
      const r = await remarcarAgendamento(agendamento.id, {
        inicio: `${formData.get('data')}T${formData.get('hora')}`,
        profissionalId: formData.get('profissionalId'),
        encaixe: formData.get('encaixe') === 'on',
      });
      if (r.ok) aoConcluir();
      else setErro(r.erro);
    });
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1">
        <dt className="text-suave">Cliente</dt>
        <dd className="font-medium">
          {agendamento.cliente.nome}
          {agendamento.cliente.telefone && (
            <span className="block text-xs font-normal text-suave">
              {agendamento.cliente.telefone}
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 text-green-700 underline"
                >
                  WhatsApp
                </a>
              )}
            </span>
          )}
        </dd>
        <dt className="text-suave">Serviço</dt>
        <dd>{agendamento.servico.nome}</dd>
        <dt className="text-suave">Profissional</dt>
        <dd>{profissional?.nome ?? '—'}</dd>
        <dt className="text-suave">Quando</dt>
        <dd>
          {dataPorExtenso(dataLocal(agendamento.inicio, fusoHorario))},{' '}
          {horaLocal(agendamento.inicio, fusoHorario)}–{horaLocal(agendamento.fim, fusoHorario)}
        </dd>
        <dt className="text-suave">Valor</dt>
        <dd>{formatarPreco(agendamento.precoCentavos)}</dd>
        <dt className="text-suave">Status</dt>
        <dd>
          {ROTULO_STATUS[agendamento.status]}
          {agendamento.origem === 'APP_CLIENTE' && (
            <span className="ml-2 text-xs text-suave">(agendado pelo app)</span>
          )}
        </dd>
        {agendamento.observacoes && (
          <>
            <dt className="text-suave">Observações</dt>
            <dd>{agendamento.observacoes}</dd>
          </>
        )}
      </dl>

      {acoes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {acoes.map((a) => (
            <button
              key={a.status}
              type="button"
              disabled={pendente}
              onClick={() => mudarStatus(a.status)}
              className={
                a.status === 'CANCELADO' || a.status === 'FALTOU'
                  ? `${classeBotaoSecundario} text-red-600`
                  : a.status === 'CONCLUIDO'
                    ? classeBotaoPrimario
                    : classeBotaoSecundario
              }
            >
              {a.rotulo}
            </button>
          ))}
          <button
            type="button"
            disabled={pendente}
            onClick={() => setRemarcando((v) => !v)}
            className={classeBotaoSecundario}
          >
            Remarcar
          </button>
        </div>
      )}

      {remarcando && (
        <form action={remarcar} className="flex flex-col gap-3 rounded-lg border border-borda p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              name="data"
              type="date"
              required
              defaultValue={dataLocal(agendamento.inicio, fusoHorario)}
              aria-label="Nova data"
              className={classeInput}
            />
            <input
              name="hora"
              type="time"
              required
              step={300}
              defaultValue={horaLocal(agendamento.inicio, fusoHorario)}
              aria-label="Novo horário"
              className={classeInput}
            />
          </div>
          <select
            name="profissionalId"
            defaultValue={agendamento.profissionalId}
            aria-label="Profissional"
            className={classeInput}
          >
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="encaixe" />
            Encaixe (permite fora da jornada ou em folga)
          </label>
          <button type="submit" disabled={pendente} className={`${classeBotaoPrimario} self-start`}>
            {pendente ? 'Salvando…' : 'Confirmar remarcação'}
          </button>
        </form>
      )}

      {erro && (
        <p role="alert" className="text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
