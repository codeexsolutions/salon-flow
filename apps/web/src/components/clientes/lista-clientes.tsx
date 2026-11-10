'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BellOff, Cake, MessageCircle, Search, Users } from 'lucide-react';
import {
  formatarPreco,
  linkWhatsApp,
  montarMensagem,
  type ClienteNaLista,
} from '@salonflow/shared';
import { classeInput } from '@/components/ui/campo';
import { EstadoVazio } from '@/components/ui/estado-vazio';

const FILTROS = {
  todos: 'Todos',
  sumidos: 'Sem vir há 60+ dias',
  aniversariantes: 'Aniversariantes do mês',
  nunca: 'Nunca vieram',
} as const;
type Filtro = keyof typeof FILTROS;

const ORDENS = {
  gasto: 'Maior gasto',
  visitas: 'Mais visitas',
  recente: 'Veio por último',
  nome: 'Nome',
} as const;
type Ordem = keyof typeof ORDENS;

const DIAS_SUMIDO = 60;

const dataCurta = (d: string) => d.split('-').reverse().join('/');
const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function quandoVeio(c: ClienteNaLista) {
  if (c.diasSemVir === null) return 'Nunca veio';
  if (c.diasSemVir === 0) return 'Veio hoje';
  if (c.diasSemVir === 1) return 'Veio ontem';
  return `Há ${c.diasSemVir} dias`;
}

/** Levantamento de clientes: busca, filtros prontos e ordenação (tudo no navegador). */
export function ListaClientes({
  clientes,
  mesAtual,
  whatsapp,
}: {
  clientes: ClienteNaLista[];
  mesAtual: string;
  /** Textos de aniversário/saudade (atalho do WhatsApp nesses filtros). */
  whatsapp: { salao: string; link: string; aniversario: string; saudade: string };
}) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [ordem, setOrdem] = useState<Ordem>('gasto');

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    const digitos = busca.replace(/\D/g, '');
    const lista = clientes.filter((c) => {
      if (filtro === 'sumidos' && !(c.diasSemVir !== null && c.diasSemVir >= DIAS_SUMIDO)) {
        return false;
      }
      if (filtro === 'aniversariantes' && c.nascimento?.slice(5, 7) !== mesAtual) return false;
      if (filtro === 'nunca' && c.visitas > 0) return false;
      if (!termo) return true;
      return (
        semAcento(c.nome).includes(termo) ||
        (c.email ?? '').toLowerCase().includes(termo) ||
        (digitos.length >= 3 && (c.telefone ?? '').replace(/\D/g, '').includes(digitos))
      );
    });
    const porNome = (a: ClienteNaLista, b: ClienteNaLista) => a.nome.localeCompare(b.nome);
    return lista.sort((a, b) => {
      switch (ordem) {
        case 'gasto':
          return b.totalGastoCentavos - a.totalGastoCentavos || porNome(a, b);
        case 'visitas':
          return b.visitas - a.visitas || porNome(a, b);
        case 'recente':
          return (b.ultimaVisita ?? '').localeCompare(a.ultimaVisita ?? '') || porNome(a, b);
        case 'nome':
          return porNome(a, b);
      }
    });
  }, [clientes, busca, filtro, ordem, mesAtual]);

  if (clientes.length === 0) {
    return (
      <EstadoVazio
        icone={Users}
        titulo="Nenhum cliente ainda"
        descricao="Os clientes aparecem aqui quando são cadastrados na agenda, na comanda ou quando agendam pelo app."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <label className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-suave"
            aria-hidden
          />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail"
            aria-label="Buscar cliente"
            className={`${classeInput} pl-9`}
          />
        </label>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as Filtro)}
          aria-label="Filtrar"
          className={`${classeInput} w-auto`}
        >
          {Object.entries(FILTROS).map(([v, r]) => (
            <option key={v} value={v}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={ordem}
          onChange={(e) => setOrdem(e.target.value as Ordem)}
          aria-label="Ordenar"
          className={`${classeInput} w-auto`}
        >
          {Object.entries(ORDENS).map(([v, r]) => (
            <option key={v} value={v}>
              Ordenar: {r}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-suave">{visiveis.length} cliente(s)</p>

      {visiveis.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda p-6 text-center text-sm text-suave">
          Nenhum cliente encontrado.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-superficie">
          {visiveis.map((c) => {
            const aniversario = c.nascimento?.slice(5, 7) === mesAtual;
            const sumido = c.diasSemVir !== null && c.diasSemVir >= DIAS_SUMIDO;
            const modelo =
              filtro === 'aniversariantes'
                ? whatsapp.aniversario
                : filtro === 'sumidos'
                  ? whatsapp.saudade
                  : null;
            const conversa =
              modelo &&
              linkWhatsApp(
                c.telefone,
                montarMensagem(modelo, {
                  nome: c.nome.trim().split(/\s+/)[0],
                  salao: whatsapp.salao,
                  link: whatsapp.link,
                }),
              );
            return (
              <li key={c.id} className="flex items-center">
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-nude/50"
                >
                  <span className="flex min-w-0 flex-1 basis-48 flex-col">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="truncate">{c.nome}</span>
                      {aniversario && (
                        <Cake
                          className="size-4 shrink-0 text-primaria"
                          aria-label={`Aniversário em ${dataCurta(c.nascimento!).slice(0, 5)}`}
                        />
                      )}
                      {!c.recebeNotificacoes && (
                        <BellOff
                          className="size-3.5 shrink-0 text-suave"
                          aria-label="Não recebe pedido de avaliação"
                        />
                      )}
                    </span>
                    <span className="truncate text-xs text-suave">
                      {c.telefone ?? c.email ?? 'Sem contato'}
                    </span>
                  </span>
                  <span className="flex flex-col text-right text-xs text-suave sm:w-28">
                    <span className="text-sm font-semibold text-foreground">
                      {formatarPreco(c.totalGastoCentavos)}
                    </span>
                    {c.visitas} visita(s)
                  </span>
                  <span className="hidden flex-col text-right text-xs text-suave sm:flex sm:w-28">
                    <span className="text-sm text-foreground">
                      {c.visitas > 0 ? formatarPreco(c.ticketMedioCentavos) : '—'}
                    </span>
                    ticket médio
                  </span>
                  <span
                    className={`w-full text-xs sm:w-28 sm:text-right ${sumido ? 'font-medium text-alerta' : 'text-suave'}`}
                  >
                    {quandoVeio(c)}
                    {c.faltas > 0 && <span className="text-perigo"> · {c.faltas} falta(s)</span>}
                  </span>
                </Link>
                {conversa && (
                  <a
                    href={conversa}
                    target="_blank"
                    rel="noreferrer"
                    className="mr-3 flex size-9 shrink-0 items-center justify-center rounded-full text-sucesso hover:bg-sucesso-suave"
                    aria-label={`Mandar mensagem para ${c.nome} no WhatsApp`}
                    title="Mandar mensagem pronta no WhatsApp"
                  >
                    <MessageCircle className="size-5" aria-hidden />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
