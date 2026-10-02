'use client';

import { useActionState } from 'react';
import {
  centavosParaTexto,
  ROTULO_UNIDADE,
  UNIDADES_PRODUTO,
  type ProdutoResumo,
} from '@salonflow/shared';
import { atualizarProduto, criarProduto } from '@/app/admin/(painel)/estoque/actions';
import type { EstadoForm } from '@/lib/api/estado-form';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';

const ROTULO_LONGO = { UN: 'Unidade', ML: 'Mililitro (ml)', G: 'Grama (g)' } as const;

/** Cadastro (sem `produto`) ou edição (com `produto`). */
export function FormProduto({ produto }: { produto?: ProdutoResumo }) {
  const acaoServidor = produto ? atualizarProduto.bind(null, produto.id) : criarProduto;
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(acaoServidor, {});
  const e = estado.erros;

  return (
    <form action={acao} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Nome" erro={e?.nome}>
          <input
            name="nome"
            required
            defaultValue={produto?.nome}
            placeholder="Shampoo hidratante"
            className={classeInput}
          />
        </Campo>
        <Campo rotulo="Marca (opcional)" erro={e?.marca}>
          <input name="marca" defaultValue={produto?.marca ?? ''} className={classeInput} />
        </Campo>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Campo rotulo="Medido em" erro={e?.unidade}>
          <select name="unidade" defaultValue={produto?.unidade ?? 'ML'} className={classeInput}>
            {UNIDADES_PRODUTO.map((u) => (
              <option key={u} value={u}>
                {ROTULO_LONGO[u]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          rotulo="Tamanho da embalagem"
          erro={e?.tamanhoEmbalagem}
          ajuda="Ex.: frasco de 1000 (ml)"
        >
          <input
            name="tamanhoEmbalagem"
            type="number"
            min={1}
            required
            defaultValue={produto?.tamanhoEmbalagem ?? ''}
            className={classeInput}
          />
        </Campo>
        <Campo rotulo="Custo da embalagem (R$)" erro={e?.custoEmbalagemCentavos}>
          <input
            name="custoEmbalagem"
            inputMode="decimal"
            required
            defaultValue={produto ? centavosParaTexto(produto.custoEmbalagemCentavos) : ''}
            placeholder="0,00"
            className={classeInput}
          />
        </Campo>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          rotulo="Preço de venda (R$, opcional)"
          erro={e?.precoVendaCentavos}
          ajuda="Preencha se o salão revende o produto ao cliente."
        >
          <input
            name="precoVenda"
            inputMode="decimal"
            defaultValue={
              produto?.precoVendaCentavos != null
                ? centavosParaTexto(produto.precoVendaCentavos)
                : ''
            }
            className={classeInput}
          />
        </Campo>
        <Campo
          rotulo={`Estoque mínimo (${ROTULO_UNIDADE[produto?.unidade ?? 'ML']}, opcional)`}
          erro={e?.estoqueMinimo}
          ajuda="Avisa quando o saldo chegar a esse valor."
        >
          <input
            name="estoqueMinimo"
            type="number"
            min={0}
            defaultValue={produto?.estoqueMinimo ?? ''}
            className={classeInput}
          />
        </Campo>
      </div>

      <MensagemForm sucesso={estado.sucesso} mensagem={estado.mensagem} />
      <button type="submit" disabled={enviando} className={`${classeBotaoPrimario} self-start`}>
        {enviando ? 'Salvando…' : produto ? 'Salvar produto' : 'Cadastrar produto'}
      </button>
    </form>
  );
}
