'use client';

import { useState, useTransition } from 'react';
import {
  formatarPreco,
  ROTULO_UNIDADE,
  type FichaTecnica,
  type ProdutoResumo,
} from '@salonflow/shared';
import { salvarFichaTecnica } from '@/app/admin/(painel)/estoque/actions';
import { classeBotaoPrimario, MensagemForm } from '@/components/ui/campo';

interface Linha {
  produtoId: string;
  quantidade: string;
}

/** Produtos que o serviço consome por atendimento (baixa automática ao fechar a comanda). */
export function EditorFichaTecnica({
  servicoId,
  ficha,
  produtos,
}: {
  servicoId: string;
  ficha: FichaTecnica;
  /** Produtos ativos do salão. */
  produtos: ProdutoResumo[];
}) {
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    ficha.itens.map((i) => ({ produtoId: i.produtoId, quantidade: String(i.quantidade) })),
  );
  const [retorno, setRetorno] = useState<{ sucesso: boolean; mensagem: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  const alterar = (i: number, m: Partial<Linha>) =>
    setLinhas((l) => l.map((x, j) => (j === i ? { ...x, ...m } : x)));

  // Prévia do custo pelo preço atual das embalagens.
  const custo = linhas.reduce((soma, l) => {
    const p = produtos.find((x) => x.id === l.produtoId);
    const q = Number(l.quantidade);
    return p && q > 0
      ? soma + Math.round((q * p.custoEmbalagemCentavos) / p.tamanhoEmbalagem)
      : soma;
  }, 0);

  function salvar() {
    const itens = linhas.map((l) => ({ produtoId: l.produtoId, quantidade: Number(l.quantidade) }));
    if (itens.some((i) => !i.produtoId || !Number.isInteger(i.quantidade) || i.quantidade <= 0)) {
      setRetorno({
        sucesso: false,
        mensagem: 'Escolha o produto e uma quantidade inteira maior que zero.',
      });
      return;
    }
    iniciar(async () => {
      const r = await salvarFichaTecnica(servicoId, { itens });
      setRetorno(
        r.ok
          ? { sucesso: true, mensagem: 'Ficha técnica salva.' }
          : { sucesso: false, mensagem: r.erro },
      );
    });
  }

  if (produtos.length === 0) {
    return (
      <p className="text-sm text-suave">
        Cadastre produtos em Estoque para montar a ficha técnica.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      {linhas.length === 0 && <p className="text-suave">Nenhum produto na ficha técnica.</p>}
      {linhas.map((l, i) => {
        const produto = produtos.find((p) => p.id === l.produtoId);
        return (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              value={l.produtoId}
              onChange={(e) => alterar(i, { produtoId: e.target.value })}
              aria-label="Produto"
              className="min-w-0 flex-1 rounded-md border border-borda bg-transparent px-2 py-1"
            >
              <option value="">Produto…</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={l.quantidade}
              onChange={(e) => alterar(i, { quantidade: e.target.value })}
              aria-label="Quantidade por atendimento"
              className="w-24 rounded-md border border-borda bg-transparent px-2 py-1"
            />
            <span className="w-6">{produto ? ROTULO_UNIDADE[produto.unidade] : ''}</span>
            <button
              type="button"
              onClick={() => setLinhas((x) => x.filter((_, j) => j !== i))}
              aria-label="Remover produto"
              className="px-1 text-suave"
            >
              ✕
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => setLinhas((l) => [...l, { produtoId: '', quantidade: '' }])}
        className="self-start text-xs text-primaria"
      >
        + produto
      </button>
      <p className="text-suave">
        Custo por atendimento: <strong className="text-foreground">{formatarPreco(custo)}</strong>
      </p>
      {retorno && <MensagemForm sucesso={retorno.sucesso} mensagem={retorno.mensagem} />}
      <button
        type="button"
        onClick={salvar}
        disabled={pendente}
        className={`${classeBotaoPrimario} self-start`}
      >
        {pendente ? 'Salvando…' : 'Salvar ficha técnica'}
      </button>
    </div>
  );
}
