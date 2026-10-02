'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  formatarDuracao,
  formatarPreco,
  JANELA_AGENDAMENTO_APP_DIAS,
  type HorariosLivresProfissional,
  type ServicoOnline,
} from '@salonflow/shared';
import { agendarNoSalao, horariosPublicos } from '@/app/(cliente)/s/[slug]/actions';
import { dataPorExtenso, hojeNoFuso, somarDias } from '@/lib/data-hora';
import { classeBotaoPrimario } from '@/components/ui/campo';
import { ConviteInstalarApp } from '@/components/pwa/convite-instalar-app';

const QUALQUER = 'qualquer';

export interface EscolhaInicial {
  servicoId?: string;
  profissionalId?: string;
  /** AAAA-MM-DDTHH:MM */
  inicio?: string;
}

/** Fluxo do cliente: serviço -> profissional -> dia -> horário -> confirmar. */
export function Agendar({
  slug,
  fusoHorario,
  servicos,
  logado,
  inicial,
}: {
  slug: string;
  fusoHorario: string;
  servicos: ServicoOnline[];
  logado: boolean;
  inicial: EscolhaInicial;
}) {
  const hoje = hojeNoFuso(fusoHorario);
  const [servicoId, setServicoId] = useState(
    servicos.some((s) => s.id === inicial.servicoId) ? inicial.servicoId! : '',
  );
  const [profissionalId, setProfissionalId] = useState(inicial.profissionalId ?? QUALQUER);
  const [data, setData] = useState(inicial.inicio?.slice(0, 10) ?? hoje);
  const [horarios, setHorarios] = useState<HorariosLivresProfissional[] | null>(null);
  const [escolha, setEscolha] = useState<{ profissionalId: string; inicio: string } | null>(
    inicial.inicio && inicial.profissionalId
      ? { profissionalId: inicial.profissionalId, inicio: inicial.inicio }
      : null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [carregando, iniciarCarga] = useTransition();
  const [enviando, iniciarEnvio] = useTransition();

  const servico = servicos.find((s) => s.id === servicoId);
  const dias = Array.from({ length: 14 }, (_, i) => somarDias(hoje, i));

  useEffect(() => {
    if (!servicoId) return;
    iniciarCarga(async () => {
      const r = await horariosPublicos(slug, servicoId, data);
      if (r.ok) setHorarios(r.dados);
      else setErro(r.erro);
    });
  }, [slug, servicoId, data]);

  // "Qualquer profissional": junta os horários; cada horário vai para o primeiro livre.
  const opcoesDeHorario = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const p of horarios ?? []) {
      if (profissionalId !== QUALQUER && p.profissionalId !== profissionalId) continue;
      for (const h of p.horarios) {
        if (!mapa.has(h.inicioLocal)) mapa.set(h.inicioLocal, p.profissionalId);
      }
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [horarios, profissionalId]);

  const profissionalEscolhido = servico?.profissionais.find(
    (p) => p.id === escolha?.profissionalId,
  );

  function trocarServico(id: string) {
    setServicoId(id);
    setProfissionalId(QUALQUER);
    setEscolha(null);
    setErro(null);
  }

  function confirmar() {
    if (!escolha) return;
    setErro(null);
    iniciarEnvio(async () => {
      const r = await agendarNoSalao(slug, {
        servicoId,
        profissionalId: escolha.profissionalId,
        inicio: escolha.inicio,
      });
      if (r.ok) {
        setConcluido(true);
        return;
      }
      setErro(r.erro);
      // O horário pode ter sido ocupado enquanto o cliente decidia: recarrega.
      const novos = await horariosPublicos(slug, servicoId, data);
      if (novos.ok) setHorarios(novos.dados);
    });
  }

  if (concluido && escolha && servico) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-sucesso/40 bg-sucesso-suave p-6 text-center">
        <p className="text-lg font-semibold">Agendamento confirmado!</p>
        <p className="text-sm">
          {servico.nome} com {profissionalEscolhido?.nome} —{' '}
          {dataPorExtenso(escolha.inicio.slice(0, 10))} às {escolha.inicio.slice(11)}.
        </p>
        <Link href="/meus-agendamentos" className={`${classeBotaoPrimario} self-center`}>
          Ver meus agendamentos
        </Link>
        <ConviteInstalarApp className="mt-2" />
      </div>
    );
  }

  const linkEntrar = escolha
    ? `/entrar?next=${encodeURIComponent(
        `/s/${slug}?servico=${servicoId}&prof=${escolha.profissionalId}&inicio=${escolha.inicio}`,
      )}`
    : '/entrar';

  return (
    <div className="flex flex-col gap-6">
      <Etapa numero={1} titulo="Escolha o serviço">
        <ul className="flex flex-col divide-y divide-borda rounded-2xl border border-borda bg-superficie">
          {servicos.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => trocarServico(s.id)}
                aria-pressed={s.id === servicoId}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${
                  s.id === servicoId ? 'bg-nude' : ''
                }`}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{s.nome}</span>
                  <span className="text-xs text-suave">
                    {s.categoria && `${s.categoria} · `}
                    {formatarDuracao(s.duracaoMin)}
                    {s.descricao && ` · ${s.descricao}`}
                  </span>
                </span>
                <span className="font-medium">{formatarPreco(s.precoCentavos)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Etapa>

      {servico && (
        <Etapa numero={2} titulo="Com quem?">
          <div className="flex flex-wrap gap-2">
            {[{ id: QUALQUER, nome: 'Qualquer profissional' }, ...servico.profissionais].map(
              (p) => (
                <Chip
                  key={p.id}
                  ativo={profissionalId === p.id}
                  onClick={() => {
                    setProfissionalId(p.id);
                    setEscolha(null);
                  }}
                >
                  {p.nome}
                  {'precoCentavos' in p && p.precoCentavos !== servico.precoCentavos && (
                    <span className="ml-1 text-xs opacity-75">
                      {formatarPreco(p.precoCentavos)}
                    </span>
                  )}
                </Chip>
              ),
            )}
          </div>
        </Etapa>
      )}

      {servico && (
        <Etapa numero={3} titulo="Quando?">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dias.map((d) => (
              <Chip
                key={d}
                ativo={d === data}
                onClick={() => {
                  setData(d);
                  setEscolha(null);
                }}
              >
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-xs">
                    {d === hoje ? 'hoje' : dataPorExtenso(d).split(',')[0].slice(0, 3)}
                  </span>
                  <span className="font-semibold">{d.slice(8)}</span>
                </span>
              </Chip>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-suave">
            Outra data:
            <input
              type="date"
              min={hoje}
              max={somarDias(hoje, JANELA_AGENDAMENTO_APP_DIAS)}
              value={data}
              onChange={(e) => {
                if (!e.target.value) return;
                setData(e.target.value);
                setEscolha(null);
              }}
              className="rounded-md border border-borda bg-transparent px-2 py-1"
            />
          </label>

          <p className="text-sm font-medium">{dataPorExtenso(data)}</p>
          {carregando ? (
            <p className="text-sm text-suave">Buscando horários…</p>
          ) : opcoesDeHorario.length === 0 ? (
            <p className="text-sm text-suave">Sem horários livres neste dia. Tente outra data.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {opcoesDeHorario.map(([inicio, profId]) => (
                <Chip
                  key={inicio}
                  ativo={escolha?.inicio === inicio}
                  onClick={() => setEscolha({ profissionalId: profId, inicio })}
                >
                  {inicio.slice(11)}
                </Chip>
              ))}
            </div>
          )}
        </Etapa>
      )}

      {servico && escolha && (
        <div className="sticky bottom-0 flex flex-col gap-3 rounded-xl border border-borda bg-background p-4 shadow-lg">
          <p className="text-sm">
            <strong>{servico.nome}</strong> com {profissionalEscolhido?.nome}
            <br />
            {dataPorExtenso(escolha.inicio.slice(0, 10))}
            às {escolha.inicio.slice(11)} ·{' '}
            {formatarPreco(profissionalEscolhido?.precoCentavos ?? servico.precoCentavos)}
          </p>
          {erro && (
            <p role="alert" className="text-sm text-perigo">
              {erro}
            </p>
          )}
          {logado ? (
            <button
              type="button"
              onClick={confirmar}
              disabled={enviando}
              className={classeBotaoPrimario}
            >
              {enviando ? 'Agendando…' : 'Confirmar agendamento'}
            </button>
          ) : (
            <Link href={linkEntrar} className={`${classeBotaoPrimario} text-center`}>
              Entrar para confirmar
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function Etapa({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-semibold">
        <span className="flex size-6 items-center justify-center rounded-full bg-primaria text-xs text-primaria-contraste">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`shrink-0 rounded-lg border px-3 py-2 text-sm ${
        ativo ? 'border-primaria bg-primaria text-primaria-contraste' : 'border-borda'
      }`}
    >
      {children}
    </button>
  );
}
