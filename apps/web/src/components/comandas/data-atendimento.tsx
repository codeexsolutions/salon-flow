'use client';

import { useState, useTransition } from 'react';
import { definirDataAtendimento } from '@/app/admin/(painel)/comandas/actions';
import { classeInput } from '@/components/ui/campo';

const formatar = (data: string) => data.split('-').reverse().join('/');

/**
 * Lançamento atrasado (só o dono): em que dia o atendimento aconteceu. A comanda
 * vale para aquele dia nas comissões e no caixa (o daquele dia, ou um criado
 * "lançado depois" se o caixa não foi aberto).
 */
export function DataAtendimento({
  comandaId,
  /** AAAA-MM-DD da comanda (null = hoje). */
  data,
  hoje,
  minimo,
}: {
  comandaId: string;
  data: string | null;
  hoje: string;
  minimo: string;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(data ?? hoje);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function salvar(nova: string | null) {
    setErro(null);
    iniciar(async () => {
      const r = await definirDataAtendimento(comandaId, { data: nova });
      if (r.ok) setEditando(false);
      else setErro(r.erro);
    });
  }

  if (data && !editando) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm">
        <span className="flex-1">
          Lançamento do dia <strong>{formatar(data)}</strong>: comissões e caixa entram nessa data.
        </span>
        <button type="button" onClick={() => setEditando(true)} className="text-xs text-primaria">
          Trocar
        </button>
        <button
          type="button"
          disabled={pendente}
          onClick={() => salvar(null)}
          className="text-xs text-suave"
        >
          Usar hoje
        </button>
        {erro && <p className="w-full text-perigo">{erro}</p>}
      </div>
    );
  }

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="self-start text-sm text-primaria"
      >
        Atendimento foi em outro dia? Lançar em data anterior
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-borda px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span>Data do atendimento</span>
        <input
          type="date"
          value={valor}
          min={minimo}
          max={hoje}
          onChange={(e) => setValor(e.target.value)}
          aria-label="Data do atendimento"
          className={`${classeInput} w-44`}
        />
        <button
          type="button"
          disabled={pendente || !valor}
          onClick={() => {
            if (
              valor !== hoje &&
              !confirm(
                `Você está lançando esta comanda no dia ${formatar(valor)}, que não é hoje. Deseja continuar?`,
              )
            ) {
              return;
            }
            salvar(valor === hoje ? null : valor);
          }}
          className="text-primaria"
        >
          {pendente ? 'Salvando…' : 'Aplicar'}
        </button>
        <button type="button" onClick={() => setEditando(false)} className="text-suave">
          Cancelar
        </button>
      </div>
      <p className="text-xs text-suave">
        Até 30 dias para trás. Os pagamentos entram no caixa daquele dia; se o caixa não foi aberto,
        o sistema cria um caixa &quot;lançado depois&quot; para a data.
      </p>
      {erro && <p className="text-perigo">{erro}</p>}
    </div>
  );
}
