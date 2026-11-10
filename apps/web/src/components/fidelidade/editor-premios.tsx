'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Gift, Pencil } from 'lucide-react';
import type { PremioFidelidade } from '@salonflow/shared';
import { salvarPremio } from '@/app/admin/(painel)/fidelidade/actions';
import {
  Campo,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeInput,
  MensagemForm,
} from '@/components/ui/campo';

const VAZIO = { nome: '', descricao: '', pontos: '', ativo: true };

/** Catálogo de prêmios: lista com edição e formulário de novo prêmio. */
export function EditorPremios({ premios }: { premios: PremioFidelidade[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | null>(null);
  const [d, setD] = useState(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function editar(p: PremioFidelidade) {
    setErro(null);
    setEditando(p.id);
    setD({ nome: p.nome, descricao: p.descricao ?? '', pontos: String(p.pontos), ativo: p.ativo });
  }

  function limpar() {
    setEditando(null);
    setErro(null);
    setD(VAZIO);
  }

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await salvarPremio(editando, {
        nome: d.nome,
        descricao: d.descricao,
        pontos: Number(d.pontos.replace(/\D/g, '')),
        ativo: d.ativo,
      });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      limpar();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      {premios.length === 0 ? (
        <p className="flex items-center gap-2 text-suave">
          <Gift className="size-4" aria-hidden />
          Nenhum prêmio ainda. Ex.: 300 pontos = hidratação; 800 pontos = escova grátis.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-borda">
          {premios.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={`font-medium ${p.ativo ? '' : 'text-suave line-through'}`}>
                  {p.nome}
                </span>
                {p.descricao && <span className="text-xs text-suave">{p.descricao}</span>}
              </span>
              <span className="shrink-0 font-semibold">{p.pontos} pts</span>
              {!p.ativo && <span className="text-xs text-suave">inativo</span>}
              <button
                type="button"
                onClick={() => editar(p)}
                className="rounded p-1.5 hover:bg-nude hover:text-primaria"
                aria-label={`Editar ${p.nome}`}
              >
                <Pencil className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={salvar}
        className="flex flex-col gap-3 rounded-xl border border-borda bg-nude/40 p-3"
      >
        <p className="font-medium">{editando ? 'Editar prêmio' : 'Novo prêmio'}</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <Campo rotulo="Prêmio">
            <input
              required
              value={d.nome}
              placeholder="Ex.: Hidratação grátis"
              onChange={(e) => setD((x) => ({ ...x, nome: e.target.value }))}
              className={classeInput}
            />
          </Campo>
          <Campo rotulo="Pontos">
            <input
              required
              inputMode="numeric"
              value={d.pontos}
              onChange={(e) => setD((x) => ({ ...x, pontos: e.target.value }))}
              className={classeInput}
            />
          </Campo>
        </div>
        <Campo rotulo="Detalhes (opcional)">
          <input
            value={d.descricao}
            placeholder="Ex.: válido de terça a quinta"
            onChange={(e) => setD((x) => ({ ...x, descricao: e.target.value }))}
            className={classeInput}
          />
        </Campo>
        {editando && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={d.ativo}
              onChange={(e) => setD((x) => ({ ...x, ativo: e.target.checked }))}
            />
            Disponível para resgate
          </label>
        )}
        {erro && <MensagemForm mensagem={erro} />}
        <div className="flex gap-2">
          <button type="submit" disabled={pendente} className={classeBotaoPrimario}>
            {pendente ? 'Salvando…' : editando ? 'Salvar prêmio' : 'Adicionar prêmio'}
          </button>
          {editando && (
            <button type="button" onClick={limpar} className={classeBotaoSecundario}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
