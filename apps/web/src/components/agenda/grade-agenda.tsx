'use client';

import { useEffect, useState } from 'react';
import type { AgendaDia, AgendamentoAgenda, ServicoResumo } from '@salonflow/shared';
import { ESTILO_STATUS, ROTULO_STATUS } from '@/lib/agenda';
import {
  hojeNoFuso,
  horaLocal,
  horaParaMinutos,
  minutosNoDia,
  minutosParaHora,
} from '@/lib/data-hora';
import { classeBotaoPrimario } from '@/components/ui/campo';
import { Dialogo } from '@/components/ui/dialogo';
import { DetalheAgendamento } from './detalhe-agendamento';
import { NovoAgendamento, type Preenchimento } from './novo-agendamento';

const PX_POR_MIN = 1.2;
const PASSO_CLIQUE_MIN = 15;

/** Faixa de horas exibida: cobre jornadas e atendimentos do dia (mínimo 08:00–20:00). */
function faixaDoDia(agenda: AgendaDia) {
  const inicios = [8 * 60];
  const fins = [20 * 60];
  for (const p of agenda.profissionais) {
    for (const j of p.jornada) {
      inicios.push(horaParaMinutos(j.inicio));
      fins.push(horaParaMinutos(j.fim));
    }
  }
  for (const a of agenda.agendamentos) {
    inicios.push(minutosNoDia(a.inicio, agenda.data, agenda.fusoHorario));
    fins.push(minutosNoDia(a.fim, agenda.data, agenda.fusoHorario));
  }
  const inicio = Math.max(0, Math.floor(Math.min(...inicios) / 60) * 60);
  const fim = Math.min(24 * 60, Math.ceil(Math.max(...fins) / 60) * 60);
  return { inicio, fim };
}

export function GradeAgenda({
  agenda,
  servicos,
}: {
  agenda: AgendaDia;
  servicos: ServicoResumo[];
}) {
  const [selecionado, setSelecionado] = useState<AgendamentoAgenda | null>(null);
  const [novo, setNovo] = useState<Preenchimento | null>(null);
  const [agoraMin, setAgoraMin] = useState<number | null>(null);

  const { inicio, fim } = faixaDoDia(agenda);
  const altura = (fim - inicio) * PX_POR_MIN;
  const topo = (minutos: number) => (minutos - inicio) * PX_POR_MIN;
  const horas = Array.from({ length: (fim - inicio) / 60 + 1 }, (_, i) => inicio + i * 60);

  // Linha do "agora" só no cliente (evita diferença entre servidor e navegador).
  useEffect(() => {
    const atualizar = () =>
      setAgoraMin(
        hojeNoFuso(agenda.fusoHorario) === agenda.data
          ? minutosNoDia(new Date().toISOString(), agenda.data, agenda.fusoHorario)
          : null,
      );
    atualizar();
    const timer = setInterval(atualizar, 60_000);
    return () => clearInterval(timer);
  }, [agenda.data, agenda.fusoHorario]);

  // Mantém o detalhe aberto em sincronia depois de uma ação (status/remarcação).
  const detalhe = selecionado && agenda.agendamentos.find((a) => a.id === selecionado.id);

  function clicarNaColuna(profissionalId: string, e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const minutos = inicio + Math.floor(y / PX_POR_MIN / PASSO_CLIQUE_MIN) * PASSO_CLIQUE_MIN;
    setNovo({ data: agenda.data, profissionalId, hora: minutosParaHora(minutos) });
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setNovo({ data: agenda.data })}
          className={classeBotaoPrimario}
        >
          Novo agendamento
        </button>
      </div>

      {agenda.profissionais.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda p-8 text-center text-sm text-suave">
          Nenhum profissional trabalha neste dia. Confira a jornada em Profissionais.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-borda">
          <div className="flex min-w-max">
            {/* Coluna das horas */}
            <div className="sticky left-0 z-20 w-14 shrink-0 border-r border-borda bg-background">
              <div className="h-10 border-b border-borda" />
              <div className="relative" style={{ height: altura }}>
                {horas.map((h) => (
                  <span
                    key={h}
                    className="absolute right-2 -translate-y-1/2 text-xs text-suave"
                    style={{ top: topo(h) }}
                  >
                    {minutosParaHora(h)}
                  </span>
                ))}
              </div>
            </div>

            {agenda.profissionais.map((p) => (
              <div key={p.id} className="w-48 shrink-0 border-r border-borda last:border-r-0">
                <div className="flex h-10 items-center gap-2 border-b border-borda px-3 text-sm font-medium">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: p.corAgenda }}
                  />
                  <span className="truncate">{p.nome}</span>
                </div>

                <div
                  className="relative cursor-copy bg-nude"
                  style={{ height: altura }}
                  onClick={(e) => clicarNaColuna(p.id, e)}
                  title="Clique para agendar neste horário"
                >
                  {/* Horário de trabalho (o resto fica acinzentado) */}
                  {p.jornada.map((j) => (
                    <div
                      key={j.inicio}
                      className="pointer-events-none absolute inset-x-0 bg-background"
                      style={{
                        top: topo(horaParaMinutos(j.inicio)),
                        height: (horaParaMinutos(j.fim) - horaParaMinutos(j.inicio)) * PX_POR_MIN,
                      }}
                    />
                  ))}

                  {/* Linhas de hora */}
                  {horas.map((h) => (
                    <div
                      key={h}
                      className="pointer-events-none absolute inset-x-0 border-t border-borda"
                      style={{ top: topo(h) }}
                    />
                  ))}

                  {/* Folgas e bloqueios */}
                  {agenda.bloqueios
                    .filter((b) => b.profissionalId === p.id)
                    .map((b) => {
                      const ini = Math.max(
                        inicio,
                        minutosNoDia(b.inicio, agenda.data, agenda.fusoHorario),
                      );
                      const fi = Math.min(
                        fim,
                        minutosNoDia(b.fim, agenda.data, agenda.fusoHorario),
                      );
                      return (
                        <div
                          key={b.id}
                          className="pointer-events-none absolute inset-x-0 flex items-start bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgb(0_0_0/0.06)_6px,rgb(0_0_0/0.06)_12px)] p-1 text-xs text-suave"
                          style={{ top: topo(ini), height: (fi - ini) * PX_POR_MIN }}
                        >
                          {b.motivo ?? 'Folga'}
                        </div>
                      );
                    })}

                  {/* Atendimentos */}
                  {agenda.agendamentos
                    .filter((a) => a.profissionalId === p.id)
                    .map((a) => {
                      const ini = minutosNoDia(a.inicio, agenda.data, agenda.fusoHorario);
                      const fi = minutosNoDia(a.fim, agenda.data, agenda.fusoHorario);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelecionado(a)}
                          className={`absolute inset-x-1 z-10 overflow-hidden rounded-md border border-borda border-l-4 px-2 py-1 text-left text-xs shadow-sm ${ESTILO_STATUS[a.status]}`}
                          style={{
                            top: topo(ini),
                            height: Math.max((fi - ini) * PX_POR_MIN, 22),
                            borderLeftColor: p.corAgenda,
                          }}
                          title={`${a.cliente.nome} · ${a.servico.nome} · ${ROTULO_STATUS[a.status]}`}
                        >
                          <span className="block truncate font-medium">
                            {horaLocal(a.inicio, agenda.fusoHorario)} {a.cliente.nome}
                          </span>
                          <span className="block truncate text-suave">{a.servico.nome}</span>
                        </button>
                      );
                    })}

                  {agoraMin !== null && agoraMin >= inicio && agoraMin <= fim && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-perigo"
                      style={{ top: topo(agoraMin) }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialogo aberto={!!detalhe} aoFechar={() => setSelecionado(null)} titulo="Atendimento">
        {detalhe && (
          <DetalheAgendamento
            agendamento={detalhe}
            profissionais={agenda.profissionais}
            fusoHorario={agenda.fusoHorario}
            aoConcluir={() => setSelecionado(null)}
          />
        )}
      </Dialogo>

      <Dialogo aberto={!!novo} aoFechar={() => setNovo(null)} titulo="Novo agendamento">
        {novo && (
          <NovoAgendamento
            servicos={servicos}
            preenchimento={novo}
            aoConcluir={() => setNovo(null)}
          />
        )}
      </Dialogo>
    </>
  );
}
