'use client';

import { useState, useTransition } from 'react';
import { PERMISSOES, ROTULO_PERMISSAO, type Permissao } from '@salonflow/shared';
import { definirPermissoes } from '@/app/admin/(painel)/equipe/actions';
import { classeBotaoPrimario, MensagemForm } from '@/components/ui/campo';

/**
 * Áreas que fazem sentido para a pessoa: "ver as próprias comissões" só para
 * quem atende (tem o app do profissional).
 */
export function opcoesPermissao(atende: boolean): Permissao[] {
  return PERMISSOES.filter((p) => p !== 'MINHAS_COMISSOES' || atende);
}

/** Lista de checkboxes com o que está liberado. */
export function CheckboxesPermissoes({
  opcoes,
  valor,
  aoMudar,
}: {
  opcoes: Permissao[];
  valor: Permissao[];
  aoMudar: (valor: Permissao[]) => void;
}) {
  return (
    <fieldset className="grid gap-2 sm:grid-cols-2">
      <legend className="sr-only">Áreas liberadas</legend>
      {opcoes.map((p) => (
        <label
          key={p}
          className="flex cursor-pointer items-start gap-2 rounded-xl border border-borda p-2.5 text-sm has-[:checked]:border-primaria/50 has-[:checked]:bg-nude"
        >
          <input
            type="checkbox"
            checked={valor.includes(p)}
            onChange={(e) =>
              aoMudar(e.target.checked ? [...valor, p] : valor.filter((v) => v !== p))
            }
            className="mt-0.5 size-4 accent-[var(--color-primaria)]"
          />
          <span className="flex flex-col">
            <span className="font-medium">{ROTULO_PERMISSAO[p].rotulo}</span>
            <span className="text-xs text-suave">{ROTULO_PERMISSAO[p].descricao}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/** Resumo do que está liberado + edição (lista da equipe). */
export function EditarPermissoes({
  id,
  nome,
  permissoes,
  atende,
}: {
  id: string;
  nome: string;
  permissoes: Permissao[];
  /** Também atende como profissional. */
  atende: boolean;
}) {
  const opcoes = opcoesPermissao(atende);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(permissoes);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const liberadas = opcoes.filter((p) => permissoes.includes(p));

  if (!editando) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {liberadas.length === 0 ? (
          <span className="text-suave">Nenhuma área liberada</span>
        ) : (
          liberadas.map((p) => (
            <span key={p} className="rounded-full border border-borda px-2 py-0.5 text-suave">
              {ROTULO_PERMISSAO[p].rotulo}
            </span>
          ))
        )}
        <button
          type="button"
          onClick={() => {
            setValor(permissoes);
            setEditando(true);
          }}
          className="font-medium text-primaria hover:underline"
        >
          Editar acessos
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-superficie">
      <p className="text-sm">
        O que <strong>{nome}</strong> pode ver e fazer:
      </p>
      <CheckboxesPermissoes opcoes={opcoes} valor={valor} aoMudar={setValor} />
      {erro && <MensagemForm mensagem={erro} />}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pendente}
          onClick={() => {
            setErro(null);
            iniciar(async () => {
              const r = await definirPermissoes(id, valor);
              if (r.ok) setEditando(false);
              else setErro(r.erro);
            });
          }}
          className={classeBotaoPrimario}
        >
          {pendente ? 'Salvando…' : 'Salvar acessos'}
        </button>
        <button type="button" onClick={() => setEditando(false)} className="text-sm text-suave">
          Cancelar
        </button>
      </div>
    </div>
  );
}
