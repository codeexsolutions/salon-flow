'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  formatarDuracao,
  formatarPreco,
  type ClienteResumo,
  type HorariosLivresProfissional,
  type ServicoResumo,
} from '@salonflow/shared';
import {
  buscarClientes,
  carregarHorarios,
  criarAgendamento,
  criarCliente,
} from '@/app/admin/(painel)/agenda/actions';
import { Campo, classeBotaoPrimario, classeInput } from '@/components/ui/campo';

export interface Preenchimento {
  data: string;
  profissionalId?: string;
  /** "HH:MM" */
  hora?: string;
}

/** Novo agendamento pela recepção: cliente -> serviço -> dia -> profissional e horário. */
export function NovoAgendamento({
  servicos,
  preenchimento,
  aoConcluir,
}: {
  servicos: ServicoResumo[];
  preenchimento: Preenchimento;
  aoConcluir: () => void;
}) {
  const [cliente, setCliente] = useState<ClienteResumo | null>(null);
  const [servicoId, setServicoId] = useState('');
  const [data, setData] = useState(preenchimento.data);
  const [opcoes, setOpcoes] = useState<HorariosLivresProfissional[] | null>(null);
  const [escolha, setEscolha] = useState<{ profissionalId: string; inicioLocal: string } | null>(
    null,
  );
  const [encaixe, setEncaixe] = useState(false);
  const [encaixeProfissional, setEncaixeProfissional] = useState(
    preenchimento.profissionalId ?? '',
  );
  const [encaixeHora, setEncaixeHora] = useState(preenchimento.hora ?? '');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, iniciarCarga] = useTransition();
  const [enviando, iniciarEnvio] = useTransition();

  // Recarrega os horários livres quando muda o serviço ou o dia.
  useEffect(() => {
    if (!servicoId) return;
    iniciarCarga(async () => {
      setEscolha(null);
      const r = await carregarHorarios(servicoId, data);
      if (!r.ok) {
        setErro(r.erro);
        setOpcoes(null);
        return;
      }
      setErro(null);
      setOpcoes(r.dados);
      // Veio de um clique na grade: já seleciona o horário, se estiver livre.
      if (preenchimento.profissionalId && preenchimento.hora && data === preenchimento.data) {
        const alvo = `${data}T${preenchimento.hora}`;
        const livre = r.dados
          .find((o) => o.profissionalId === preenchimento.profissionalId)
          ?.horarios.some((h) => h.inicioLocal === alvo);
        if (livre) setEscolha({ profissionalId: preenchimento.profissionalId, inicioLocal: alvo });
      }
    });
  }, [servicoId, data, preenchimento]);

  const servico = servicos.find((s) => s.id === servicoId);
  const destino = encaixe
    ? encaixeProfissional && encaixeHora
      ? { profissionalId: encaixeProfissional, inicioLocal: `${data}T${encaixeHora}` }
      : null
    : escolha;

  function agendar() {
    if (!cliente || !servicoId || !destino) return;
    setErro(null);
    iniciarEnvio(async () => {
      const r = await criarAgendamento({
        clienteId: cliente.id,
        servicoId,
        profissionalId: destino.profissionalId,
        inicio: destino.inicioLocal,
        observacoes: observacoes.trim() || undefined,
        encaixe,
      });
      if (r.ok) aoConcluir();
      else setErro(r.erro);
    });
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <EscolhaCliente cliente={cliente} aoEscolher={setCliente} />

      <Campo rotulo="Serviço">
        <select
          value={servicoId}
          onChange={(e) => setServicoId(e.target.value)}
          className={classeInput}
        >
          <option value="">Escolha o serviço…</option>
          {servicos.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome} · {formatarDuracao(s.duracaoMin)} · {formatarPreco(s.precoCentavos)}
            </option>
          ))}
        </select>
      </Campo>

      <Campo rotulo="Dia">
        <input
          type="date"
          value={data}
          onChange={(e) => e.target.value && setData(e.target.value)}
          className={classeInput}
        />
      </Campo>

      {servico && (
        <div className="flex flex-col gap-2">
          <span className="font-medium">Profissional e horário</span>
          {carregando && <p className="text-suave">Carregando horários…</p>}
          {!carregando && opcoes?.length === 0 && (
            <p className="text-alerta">Nenhum profissional faz este serviço.</p>
          )}
          {!carregando &&
            !encaixe &&
            opcoes?.map((o) => (
              <div key={o.profissionalId} className="rounded-lg border border-borda p-2">
                <p className="mb-2 font-medium">
                  {o.nome}{' '}
                  <span className="font-normal text-suave">
                    · {formatarDuracao(o.duracaoMin)} · {formatarPreco(o.precoCentavos)}
                  </span>
                </p>
                {o.horarios.length === 0 ? (
                  <p className="text-xs text-suave">Sem horários livres neste dia.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {o.horarios.map((h) => {
                      const ativo =
                        escolha?.profissionalId === o.profissionalId &&
                        escolha.inicioLocal === h.inicioLocal;
                      return (
                        <button
                          key={h.inicio}
                          type="button"
                          onClick={() =>
                            setEscolha({
                              profissionalId: o.profissionalId,
                              inicioLocal: h.inicioLocal,
                            })
                          }
                          aria-pressed={ativo}
                          className={`rounded-md border px-2 py-1 text-xs ${
                            ativo
                              ? 'border-primaria bg-primaria text-primaria-contraste'
                              : 'border-borda'
                          }`}
                        >
                          {h.inicioLocal.slice(11)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={encaixe}
              onChange={(e) => setEncaixe(e.target.checked)}
            />
            Encaixe: escolher horário manualmente (fora da jornada ou em folga)
          </label>
          {encaixe && (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={encaixeProfissional}
                onChange={(e) => setEncaixeProfissional(e.target.value)}
                aria-label="Profissional do encaixe"
                className={classeInput}
              >
                <option value="">Profissional…</option>
                {opcoes?.map((o) => (
                  <option key={o.profissionalId} value={o.profissionalId}>
                    {o.nome}
                  </option>
                ))}
              </select>
              <input
                type="time"
                step={300}
                value={encaixeHora}
                onChange={(e) => setEncaixeHora(e.target.value)}
                aria-label="Horário do encaixe"
                className={classeInput}
              />
            </div>
          )}
        </div>
      )}

      <Campo rotulo="Observações (opcional)">
        <input
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          maxLength={500}
          className={classeInput}
        />
      </Campo>

      {erro && (
        <p role="alert" className="text-perigo">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={agendar}
        disabled={!cliente || !servicoId || !destino || enviando}
        className={classeBotaoPrimario}
      >
        {enviando ? 'Agendando…' : 'Agendar'}
      </button>
    </div>
  );
}

/** Busca o cliente pelo nome/telefone ou cadastra um novo na hora. */
export function EscolhaCliente({
  cliente,
  aoEscolher,
}: {
  cliente: ClienteResumo | null;
  aoEscolher: (c: ClienteResumo | null) => void;
}) {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<ClienteResumo[]>([]);
  const [novo, setNovo] = useState<{ nome: string; telefone: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const buscaValida = busca.trim().length >= 2;
  // Espera o usuário parar de digitar (300 ms) antes de consultar.
  useEffect(() => {
    if (!buscaValida) return;
    const espera = setTimeout(async () => {
      const r = await buscarClientes(busca);
      if (r.ok) setResultados(r.dados);
    }, 300);
    return () => clearTimeout(espera);
  }, [busca, buscaValida]);
  const visiveis = buscaValida ? resultados : [];

  if (cliente) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-borda px-3 py-2">
        <span>
          <span className="font-medium">{cliente.nome}</span>
          {cliente.telefone && <span className="text-suave"> · {cliente.telefone}</span>}
        </span>
        <button type="button" onClick={() => aoEscolher(null)} className="text-xs text-primaria">
          Trocar
        </button>
      </div>
    );
  }

  if (novo) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-borda p-3">
        <span className="font-medium">Novo cliente</span>
        <input
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
          placeholder="Nome"
          aria-label="Nome do cliente"
          className={classeInput}
        />
        <input
          value={novo.telefone}
          onChange={(e) => setNovo({ ...novo, telefone: e.target.value })}
          placeholder="Telefone / WhatsApp (opcional)"
          aria-label="Telefone do cliente"
          inputMode="tel"
          className={classeInput}
        />
        {erro && <p className="text-perigo">{erro}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                const r = await criarCliente(novo);
                if (r.ok) aoEscolher(r.dados);
                else setErro(r.erro);
              })
            }
            className={classeBotaoPrimario}
          >
            Salvar cliente
          </button>
          <button type="button" onClick={() => setNovo(null)} className="text-suave">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <Campo rotulo="Cliente">
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome ou telefone…"
        className={classeInput}
      />
      {visiveis.length > 0 && (
        <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda bg-superficie">
          {visiveis.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => aoEscolher(c)}
                className="w-full px-3 py-2 text-left"
              >
                {c.nome}
                {c.telefone && <span className="text-suave"> · {c.telefone}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setNovo({ nome: busca.trim(), telefone: '' })}
        className="self-start text-xs text-primaria"
      >
        + Cadastrar novo cliente{busca.trim() && ` "${busca.trim()}"`}
      </button>
    </Campo>
  );
}
