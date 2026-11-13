import { Check, MapPin } from 'lucide-react';

/*
 * Ilustrações (não interativas) das telas do SalonFlow para a página inicial.
 * Dados de exemplo; só mostram como o produto é.
 */

const PROFISSIONAIS = ['Ana', 'Diego', 'Carla'];
const HORAS = ['09:00', '10:00', '11:00', '12:00', '13:00'];
/** [coluna, linha inicial, linhas, cliente, serviço, tom] */
const BLOCOS: [number, number, number, string, string, 'cheio' | 'claro'][] = [
  [0, 0, 2, 'Juliana M.', 'Escova + hidratação', 'cheio'],
  [1, 0, 1, 'Pedro A.', 'Corte masculino', 'claro'],
  [1, 1, 1, 'Rafael S.', 'Barba', 'cheio'],
  [2, 1, 2, 'Marina L.', 'Esmaltação em gel', 'claro'],
  [0, 3, 1, 'Beatriz C.', 'Design de sobrancelha', 'claro'],
  [1, 3, 2, 'Lucas F.', 'Corte + barba', 'cheio'],
  [2, 4, 1, 'Sofia R.', 'Pé e mão', 'cheio'],
];

/** Agenda do dia no painel, por profissional. */
export function IlustracaoPainel() {
  return (
    <div
      aria-hidden
      className="w-full select-none overflow-hidden rounded-3xl border border-borda bg-superficie shadow-lg"
    >
      <div className="flex items-center justify-between gap-3 border-b border-borda px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-perigo/60" />
          <span className="size-2.5 rounded-full bg-alerta/60" />
          <span className="size-2.5 rounded-full bg-sucesso/60" />
          <span className="ml-3 font-display text-sm font-semibold">
            Agenda · Terça, 17 de novembro
          </span>
        </div>
        <span className="hidden rounded-full bg-nude px-3 py-1 text-xs font-medium text-primaria sm:inline">
          9 atendimentos
        </span>
      </div>
      <div className="grid grid-cols-[3.25rem_repeat(3,minmax(0,1fr))] text-xs">
        <span />
        {PROFISSIONAIS.map((p) => (
          <span key={p} className="border-l border-borda px-2 py-2 font-medium">
            {p}
          </span>
        ))}
        <div className="relative col-span-4 grid grid-cols-[3.25rem_repeat(3,minmax(0,1fr))]">
          {HORAS.map((h) => (
            <div key={h} className="contents">
              <span className="h-14 border-t border-borda px-2 pt-1 text-suave tabular-nums">
                {h}
              </span>
              {PROFISSIONAIS.map((p) => (
                <span key={p} className="h-14 border-t border-l border-borda" />
              ))}
            </div>
          ))}
          {BLOCOS.map(([col, ini, linhas, cliente, servico, tom]) => (
            <span
              key={cliente}
              className={`absolute m-1 flex flex-col overflow-hidden rounded-lg px-2 py-1 leading-tight ${
                tom === 'cheio' ? 'bg-botao text-botao-contraste' : 'bg-nude text-foreground'
              }`}
              style={{
                left: `calc(3.25rem + ${col} * (100% - 3.25rem) / 3)`,
                width: 'calc((100% - 3.25rem) / 3 - 0.5rem)',
                top: `${ini * 3.5}rem`,
                height: `${linhas * 3.5 - 0.5}rem`,
              }}
            >
              <span className="truncate font-medium">{cliente}</span>
              <span className="truncate opacity-80">{servico}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Extrato de comissões de um profissional. */
export function IlustracaoComissoes() {
  const linhas = [
    ['#118', 'Escova + hidratação', 'R$ 120,00', '40%', 'R$ 48,00'],
    ['#121', 'Coloração', 'R$ 180,00', '35%', 'R$ 63,00'],
    ['#124', 'Corte feminino', 'R$ 90,00', '50%', 'R$ 45,00'],
  ];
  return (
    <div
      aria-hidden
      className="w-full select-none rounded-3xl border border-borda bg-superficie p-5 shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-display font-semibold">Ana Souza</span>
        <span className="rounded-full bg-alerta-suave px-2.5 py-0.5 text-xs font-medium text-alerta">
          R$ 156,00 pendente
        </span>
      </div>
      <ul className="mt-4 flex flex-col divide-y divide-borda text-sm tabular-nums">
        {linhas.map(([n, servico, valor, pct, comissao]) => (
          <li key={n} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 py-2">
            <span className="text-suave">{n}</span>
            <span className="min-w-0">
              <span className="block truncate">{servico}</span>
              <span className="text-xs text-suave">
                {valor} · {pct}
              </span>
            </span>
            <span className="font-medium">{comissao}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-borda pt-3">
        <span className="text-sm text-suave">Total do período</span>
        <span className="rounded-xl bg-botao px-3 py-1.5 text-sm font-medium text-botao-contraste">
          Pagar R$ 156,00
        </span>
      </div>
    </div>
  );
}

/** Agendamento do cliente pelo celular. */
export function IlustracaoAgendamento() {
  const horarios = ['14:00', '14:30', '15:30', '16:00', '17:00', '17:30'];
  return (
    <div aria-hidden className="relative mx-auto mb-6 w-full max-w-xs select-none">
      <div className="rounded-[2rem] border border-borda bg-superficie p-5 pb-11 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-botao font-display font-bold text-botao-contraste">
            SB
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">Studio Bela Vista</p>
            <p className="inline-flex items-center gap-1 text-xs text-suave">
              <MapPin className="size-3" /> seu link de agendamento
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-nude px-4 py-3 text-sm">
          <span>
            <span className="block font-medium">Corte + escova</span>
            <span className="text-xs text-suave">com Ana · 1h</span>
          </span>
          <span className="font-display font-bold">R$ 95</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          {horarios.map((h) => (
            <span
              key={h}
              className={`rounded-xl border py-1.5 text-center ${
                h === '15:30'
                  ? 'border-botao bg-botao font-medium text-botao-contraste'
                  : 'border-borda'
              }`}
            >
              {h}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-2xl border border-borda bg-superficie px-4 py-2.5 text-sm shadow-md">
        <span className="flex size-6 items-center justify-center rounded-full bg-sucesso text-white">
          <Check className="size-3.5" />
        </span>
        <span>
          <span className="block font-medium leading-tight">Novo agendamento</span>
          <span className="text-xs text-suave">Qui · 15:30 · sem ligação</span>
        </span>
      </div>
    </div>
  );
}
