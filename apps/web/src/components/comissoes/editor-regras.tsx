'use client';

import { useState, useTransition } from 'react';
import {
  textoParaBps,
  type ProfissionalResumo,
  type RegraComissaoDto,
  type ServicoResumo,
} from '@salonflow/shared';
import { salvarRegrasComissao } from '@/app/admin/(painel)/comissoes/actions';
import { classeBotaoPrimario, MensagemForm } from '@/components/ui/campo';

interface Linha {
  profissionalId: string;
  servicoId: string;
  percentual: string;
}

const TODOS = '';

/** Regras específicas: por profissional, por serviço ou pela combinação dos dois. */
export function EditorRegras({
  regras,
  profissionais,
  servicos,
}: {
  regras: RegraComissaoDto[];
  profissionais: ProfissionalResumo[];
  servicos: ServicoResumo[];
}) {
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    regras.map((r) => ({
      profissionalId: r.profissionalId ?? TODOS,
      servicoId: r.servicoId ?? TODOS,
      percentual: String(r.percentualBps / 100).replace('.', ','),
    })),
  );
  const [retorno, setRetorno] = useState<{ sucesso: boolean; mensagem: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  const alterar = (i: number, mudanca: Partial<Linha>) =>
    setLinhas((l) => l.map((x, j) => (j === i ? { ...x, ...mudanca } : x)));

  function salvar() {
    const convertidas = linhas.map((l) => ({
      profissionalId: l.profissionalId || null,
      servicoId: l.servicoId || null,
      percentualBps: textoParaBps(l.percentual),
    }));
    if (convertidas.some((r) => r.percentualBps === null)) {
      setRetorno({ sucesso: false, mensagem: 'Use percentuais entre 0 e 100.' });
      return;
    }
    if (convertidas.some((r) => !r.profissionalId && !r.servicoId)) {
      setRetorno({ sucesso: false, mensagem: 'Cada regra precisa de um profissional ou serviço.' });
      return;
    }
    iniciar(async () => {
      const r = await salvarRegrasComissao({ regras: convertidas });
      setRetorno(
        r.ok ? { sucesso: true, mensagem: 'Regras salvas.' } : { sucesso: false, mensagem: r.erro },
      );
    });
  }

  const selectClasse = 'min-w-0 flex-1 rounded-md border border-borda bg-transparent px-2 py-1';

  return (
    <div className="flex flex-col gap-3 text-sm">
      {linhas.length === 0 && (
        <p className="text-suave">Nenhuma regra específica: todos recebem o percentual padrão.</p>
      )}
      {linhas.map((l, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select
            value={l.profissionalId}
            onChange={(e) => alterar(i, { profissionalId: e.target.value })}
            aria-label="Profissional"
            className={selectClasse}
          >
            <option value={TODOS}>Qualquer profissional</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <select
            value={l.servicoId}
            onChange={(e) => alterar(i, { servicoId: e.target.value })}
            aria-label="Serviço"
            className={selectClasse}
          >
            <option value={TODOS}>Qualquer serviço</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
          <span className="flex items-center gap-1">
            <input
              value={l.percentual}
              onChange={(e) => alterar(i, { percentual: e.target.value })}
              inputMode="decimal"
              aria-label="Percentual"
              className="w-16 rounded-md border border-borda bg-transparent px-2 py-1"
            />
            %
          </span>
          <button
            type="button"
            onClick={() => setLinhas((x) => x.filter((_, j) => j !== i))}
            aria-label="Remover regra"
            className="px-1 text-suave"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setLinhas((l) => [...l, { profissionalId: TODOS, servicoId: TODOS, percentual: '50' }])
        }
        className="self-start text-xs text-primaria"
      >
        + nova regra
      </button>
      <p className="text-xs text-suave">
        Prioridade: profissional + serviço → só o serviço → só o profissional → padrão do salão.
        Mudanças valem para as próximas comandas fechadas.
      </p>
      {retorno && <MensagemForm sucesso={retorno.sucesso} mensagem={retorno.mensagem} />}
      <button
        type="button"
        onClick={salvar}
        disabled={pendente}
        className={`${classeBotaoPrimario} self-start`}
      >
        {pendente ? 'Salvando…' : 'Salvar regras'}
      </button>
    </div>
  );
}
