'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  centavosParaTexto,
  FORMAS_PAGAMENTO,
  formatarPreco,
  ROTULO_FORMA_PAGAMENTO,
  textoParaCentavos,
  type ComandaDetalhe,
  type FormaPagamento,
  type ProfissionalResumo,
  type ProdutoResumo,
  type ServicoResumo,
} from '@salonflow/shared';
import {
  adicionarItem,
  cancelarComanda,
  fecharComanda,
  removerItem,
  salvarComanda,
} from '@/app/admin/(painel)/comandas/actions';
import type { Resultado } from '@/lib/api/resultado';
import { EscolhaCliente } from '@/components/agenda/novo-agendamento';
import { classeBotaoPrimario, classeBotaoSecundario, classeInput } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';

interface LinhaPagamento {
  forma: FormaPagamento;
  valor: string;
}

/** Comanda ABERTA: cliente, itens, desconto e fechamento com pagamentos. */
export function EditorComanda({
  comanda,
  servicos,
  profissionais,
  produtos,
}: {
  comanda: ComandaDetalhe;
  servicos: ServicoResumo[];
  profissionais: ProfissionalResumo[];
  /** Produtos à venda (ativos e com preço de venda). */
  produtos: ProdutoResumo[];
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [novoServico, setNovoServico] = useState('');
  const [novoProfissional, setNovoProfissional] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novoProduto, setNovoProduto] = useState('');
  const [quantidadeProduto, setQuantidadeProduto] = useState('1');
  const [desconto, setDesconto] = useState(centavosParaTexto(comanda.descontoCentavos));
  const [pagamentos, setPagamentos] = useState<LinhaPagamento[]>([
    { forma: 'PIX', valor: centavosParaTexto(comanda.totalCentavos) },
  ]);

  const total = comanda.totalCentavos;
  const pagos = pagamentos.map((p) => textoParaCentavos(p.valor));
  const somaPagos = pagos.reduce<number>((s, v) => s + (v ?? 0), 0);
  const pagamentoValido = pagos.every((v) => v !== null && v > 0) && somaPagos === total;

  function executar(acao: () => Promise<Resultado<unknown>>, depois?: () => void) {
    setErro(null);
    iniciar(async () => {
      const r = await acao();
      if (!r.ok) setErro(r.erro);
      else depois?.();
    });
  }

  function incluirItem() {
    const valorCentavos = novoValor.trim() ? textoParaCentavos(novoValor) : undefined;
    if (valorCentavos === null) {
      setErro('Valor inválido. Ex.: 45,00');
      return;
    }
    executar(
      () =>
        adicionarItem(comanda.id, {
          tipo: 'SERVICO',
          servicoId: novoServico,
          profissionalId: novoProfissional,
          valorCentavos,
        }),
      () => {
        setNovoServico('');
        setNovoValor('');
      },
    );
  }

  function venderProduto() {
    executar(
      () =>
        adicionarItem(comanda.id, {
          tipo: 'PRODUTO',
          produtoId: novoProduto,
          quantidade: Number(quantidadeProduto),
        }),
      () => {
        setNovoProduto('');
        setQuantidadeProduto('1');
      },
    );
  }

  function aplicarDesconto() {
    const centavos = textoParaCentavos(desconto || '0');
    if (centavos === null) {
      setErro('Desconto inválido. Ex.: 10,00');
      return;
    }
    executar(() => salvarComanda(comanda.id, { descontoCentavos: centavos }));
  }

  function fechar() {
    executar(() =>
      fecharComanda(comanda.id, {
        pagamentos: pagamentos.map((p) => ({
          forma: p.forma,
          valorCentavos: textoParaCentavos(p.valor),
        })),
      }),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Secao titulo="Cliente">
        {comanda.cliente ? (
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{comanda.cliente.nome}</span>
            <button
              type="button"
              disabled={pendente}
              onClick={() => executar(() => salvarComanda(comanda.id, { clienteId: null }))}
              className="text-xs text-primaria"
            >
              Trocar
            </button>
          </div>
        ) : (
          <EscolhaCliente
            cliente={null}
            aoEscolher={(c) => c && executar(() => salvarComanda(comanda.id, { clienteId: c.id }))}
          />
        )}
      </Secao>

      <Secao titulo="Itens">
        {comanda.itens.length === 0 ? (
          <p className="text-sm text-suave">Nenhum item na comanda.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda bg-superficie text-sm">
            {comanda.itens.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">
                    {item.tipo === 'PRODUTO' && item.quantidade > 1 && `${item.quantidade}× `}
                    {item.descricao}
                  </span>
                  <span className="text-xs text-suave">
                    {item.tipo === 'PRODUTO' ? 'Venda de produto' : item.profissional?.nome}
                    {item.agendamentoId && ' · do agendamento'}
                  </span>
                </span>
                <span>{formatarPreco(item.valorCentavos)}</span>
                <button
                  type="button"
                  disabled={pendente}
                  onClick={() => executar(() => removerItem(comanda.id, item.id))}
                  aria-label={`Remover ${item.descricao}`}
                  className="px-1 text-suave"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_7rem_auto]">
          <select
            value={novoServico}
            onChange={(e) => setNovoServico(e.target.value)}
            aria-label="Serviço"
            className={classeInput}
          >
            <option value="">Serviço…</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} · {formatarPreco(s.precoCentavos)}
              </option>
            ))}
          </select>
          <select
            value={novoProfissional}
            onChange={(e) => setNovoProfissional(e.target.value)}
            aria-label="Profissional"
            className={classeInput}
          >
            <option value="">Profissional…</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <input
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            inputMode="decimal"
            placeholder="Valor"
            title="Em branco = preço do serviço"
            aria-label="Valor (opcional)"
            className={classeInput}
          />
          <button
            type="button"
            disabled={pendente || !novoServico || !novoProfissional}
            onClick={incluirItem}
            className={classeBotaoSecundario}
          >
            Adicionar
          </button>
        </div>

        {produtos.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-[1fr_5rem_auto]">
            <select
              value={novoProduto}
              onChange={(e) => setNovoProduto(e.target.value)}
              aria-label="Produto à venda"
              className={classeInput}
            >
              <option value="">Vender produto…</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} · {formatarPreco(p.precoVendaCentavos ?? 0)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={100}
              value={quantidadeProduto}
              onChange={(e) => setQuantidadeProduto(e.target.value)}
              aria-label="Quantidade"
              className={classeInput}
            />
            <button
              type="button"
              disabled={pendente || !novoProduto || Number(quantidadeProduto) < 1}
              onClick={venderProduto}
              className={classeBotaoSecundario}
            >
              Adicionar
            </button>
          </div>
        )}
      </Secao>

      <Secao titulo="Pagamento">
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
          <dt className="text-suave">Subtotal</dt>
          <dd>{formatarPreco(comanda.subtotalCentavos)}</dd>
          <dt className="flex items-center gap-2 text-suave">
            Desconto R$
            <input
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              inputMode="decimal"
              aria-label="Desconto em reais"
              className="w-24 rounded-md border border-borda bg-transparent px-2 py-1"
            />
            <button
              type="button"
              onClick={aplicarDesconto}
              disabled={pendente}
              className="text-xs text-primaria"
            >
              Aplicar
            </button>
          </dt>
          <dd>− {formatarPreco(comanda.descontoCentavos)}</dd>
          <dt className="font-semibold">Total</dt>
          <dd className="font-semibold">{formatarPreco(total)}</dd>
        </dl>

        <div className="flex flex-col gap-2">
          {pagamentos.map((p, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={p.forma}
                onChange={(e) =>
                  setPagamentos((l) =>
                    l.map((x, j) =>
                      j === i ? { ...x, forma: e.target.value as FormaPagamento } : x,
                    ),
                  )
                }
                aria-label="Forma de pagamento"
                className={classeInput}
              >
                {FORMAS_PAGAMENTO.map((f) => (
                  <option key={f} value={f}>
                    {ROTULO_FORMA_PAGAMENTO[f]}
                  </option>
                ))}
              </select>
              <input
                value={p.valor}
                onChange={(e) =>
                  setPagamentos((l) =>
                    l.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)),
                  )
                }
                inputMode="decimal"
                aria-label="Valor pago"
                className={`${classeInput} w-32`}
              />
              {pagamentos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPagamentos((l) => l.filter((_, j) => j !== i))}
                  aria-label="Remover pagamento"
                  className="px-1 text-suave"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setPagamentos((l) => [
                ...l,
                { forma: 'DINHEIRO', valor: centavosParaTexto(Math.max(0, total - somaPagos)) },
              ])
            }
            className="self-start text-xs text-primaria"
          >
            + dividir em outra forma de pagamento
          </button>
          {somaPagos !== total && (
            <p className="text-sm text-alerta">
              {somaPagos < total
                ? `Faltam ${formatarPreco(total - somaPagos)}`
                : `Pagamentos passam do total em ${formatarPreco(somaPagos - total)}`}
            </p>
          )}
        </div>
      </Secao>

      {erro && (
        <p role="alert" className="text-sm text-perigo">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={fechar}
          disabled={pendente || comanda.itens.length === 0 || !pagamentoValido}
          className={classeBotaoPrimario}
        >
          {pendente ? 'Salvando…' : `Fechar comanda · ${formatarPreco(total)}`}
        </button>
        <button
          type="button"
          disabled={pendente}
          onClick={() => {
            if (confirm('Cancelar esta comanda?')) {
              executar(
                () => cancelarComanda(comanda.id),
                () => router.push('/admin/comandas'),
              );
            }
          }}
          className={`${classeBotaoSecundario} text-perigo`}
        >
          Cancelar comanda
        </button>
      </div>
    </div>
  );
}
