'use client';

import { useState, useTransition } from 'react';
import {
  formatarPercentual,
  PARCELAS_MAXIMAS,
  textoParaBps,
  type MaquininhaDto,
} from '@salonflow/shared';
import { salvarMaquininha } from '@/app/admin/(painel)/comissoes/actions';
import { classeBotaoPrimario, classeBotaoSecundario, MensagemForm } from '@/components/ui/campo';

const PARCELAS = Array.from({ length: PARCELAS_MAXIMAS }, (_, k) => k + 1);
const paraTexto = (bps: number) => (bps ? String(bps / 100).replace('.', ',') : '');

/** Lista de maquininhas com as taxas; o dono cadastra e edita. */
export function EditorMaquininhas({ maquininhas }: { maquininhas: MaquininhaDto[] }) {
  const [editando, setEditando] = useState<string | 'nova' | null>(null);

  return (
    <div className="flex flex-col gap-3 text-sm">
      {maquininhas.length === 0 && editando !== 'nova' && (
        <p className="text-suave">
          Nenhuma maquininha cadastrada: no cartão vale a taxa da forma de pagamento (acima).
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {maquininhas.map((m) =>
          editando === m.id ? (
            <li key={m.id}>
              <FormMaquininha maquininha={m} aoTerminar={() => setEditando(null)} />
            </li>
          ) : (
            <li
              key={m.id}
              className={`flex flex-col gap-2 rounded-xl border border-borda p-3 ${m.ativo ? '' : 'opacity-60'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {m.nome}
                  {!m.ativo && <span className="ml-2 text-xs text-suave">(desativada)</span>}
                </span>
                <button
                  type="button"
                  onClick={() => setEditando(m.id)}
                  className="text-xs font-medium text-primaria"
                >
                  Editar
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs text-suave">
                <span className="rounded-full border border-borda px-2 py-0.5">
                  Débito {formatarPercentual(m.taxaDebitoBps)}
                </span>
                {m.taxasCreditoBps.map((t, k) => (
                  <span key={k} className="rounded-full border border-borda px-2 py-0.5">
                    {k + 1}x {formatarPercentual(t)}
                  </span>
                ))}
              </div>
            </li>
          ),
        )}
      </ul>
      {editando === 'nova' ? (
        <FormMaquininha aoTerminar={() => setEditando(null)} />
      ) : (
        <button
          type="button"
          onClick={() => setEditando('nova')}
          className={`${classeBotaoSecundario} self-start`}
        >
          + Adicionar maquininha
        </button>
      )}
    </div>
  );
}

function FormMaquininha({
  maquininha,
  aoTerminar,
}: {
  maquininha?: MaquininhaDto;
  aoTerminar: () => void;
}) {
  const [nome, setNome] = useState(maquininha?.nome ?? '');
  const [debito, setDebito] = useState(paraTexto(maquininha?.taxaDebitoBps ?? 0));
  const [credito, setCredito] = useState(
    PARCELAS.map((n) => paraTexto(maquininha?.taxasCreditoBps[n - 1] ?? 0)),
  );
  const [ativo, setAtivo] = useState(maquininha?.ativo ?? true);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const bps = (t: string) => (t.trim() === '' ? 0 : textoParaBps(t));

  function salvar() {
    const taxaDebitoBps = bps(debito);
    const taxasCreditoBps = credito.map(bps);
    if (taxaDebitoBps === null || taxasCreditoBps.some((t) => t === null)) {
      setErro('Confira as taxas: use números de 0 a 100, ex.: 3,49');
      return;
    }
    setErro(null);
    iniciar(async () => {
      const r = await salvarMaquininha(maquininha?.id ?? null, {
        nome,
        taxaDebitoBps,
        taxasCreditoBps,
        ativo,
      });
      if (r.ok) aoTerminar();
      else setErro(r.erro);
    });
  }

  const campo = (valor: string, mudar: (v: string) => void, rotulo: string) => (
    <label className="flex flex-col gap-1 text-xs text-suave">
      {rotulo}
      <span className="flex items-center gap-1">
        <input
          value={valor}
          onChange={(e) => mudar(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          className="w-16 rounded-md border border-borda bg-transparent px-2 py-1 text-sm text-foreground"
        />
        %
      </span>
    </label>
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primaria/40 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-suave">
          Nome
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Stone, PagSeguro"
            maxLength={60}
            autoFocus
            className="rounded-md border border-borda bg-transparent px-2 py-1 text-sm text-foreground"
          />
        </label>
        {campo(debito, setDebito, 'Débito')}
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs text-suave">Crédito por número de parcelas</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PARCELAS.map((n) =>
            campo(
              credito[n - 1],
              (v) => setCredito((l) => l.map((x, k) => (k === n - 1 ? v : x))),
              n === 1 ? '1x (à vista)' : `${n}x`,
            ),
          )}
        </div>
      </fieldset>
      {maquininha && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Ativa (aparece ao fechar a comanda)
        </label>
      )}
      {erro && <MensagemForm mensagem={erro} />}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pendente || nome.trim().length < 2}
          onClick={salvar}
          className={classeBotaoPrimario}
        >
          {pendente ? 'Salvando…' : 'Salvar maquininha'}
        </button>
        <button type="button" onClick={aoTerminar} className="text-suave">
          Cancelar
        </button>
      </div>
    </div>
  );
}
