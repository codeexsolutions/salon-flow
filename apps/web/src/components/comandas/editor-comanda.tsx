'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  centavosParaTexto,
  FORMAS_PAGAMENTO,
  formatarPercentual,
  formatarPreco,
  PARCELAS_MAXIMAS,
  ROTULO_FORMA_PAGAMENTO,
  textoParaCentavos,
  type ComandaDetalhe,
  type FormaPagamento,
  type ItemComanda,
  type MaquininhaDto,
  type ProfissionalResumo,
  type ProdutoResumo,
  type ServicoResumo,
} from '@salonflow/shared';
import {
  adicionarItem,
  atualizarItem,
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
  /** Cartão: maquininha (a taxa vem da tabela dela) e parcelas no crédito. */
  maquininhaId: string;
  parcelas: number;
}

const ehCartao = (forma: FormaPagamento) => forma === 'DEBITO' || forma === 'CREDITO';

/** Comanda ABERTA: cliente, itens, desconto e fechamento com pagamentos. */
export function EditorComanda({
  comanda,
  servicos,
  profissionais,
  produtos,
  maquininhas = [],
  cabecalho,
}: {
  comanda: ComandaDetalhe;
  servicos: ServicoResumo[];
  profissionais: ProfissionalResumo[];
  /** Produtos à venda (ativos e com preço de venda). */
  produtos: ProdutoResumo[];
  /** Maquininhas ativas (taxa do cartão por parcelas). */
  maquininhas?: MaquininhaDto[];
  /** Conteúdo extra no topo (ex.: data do atendimento, só para o dono). */
  cabecalho?: React.ReactNode;
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
  const novaLinha = (forma: FormaPagamento, valorCentavos: number): LinhaPagamento => ({
    forma,
    valor: centavosParaTexto(valorCentavos),
    maquininhaId: maquininhas[0]?.id ?? '',
    parcelas: 1,
  });
  const [pagamentos, setPagamentos] = useState<LinhaPagamento[]>(() => [
    novaLinha('PIX', comanda.totalCentavos),
  ]);
  const alterarLinha = (i: number, mudanca: Partial<LinhaPagamento>) =>
    setPagamentos((l) => l.map((x, j) => (j === i ? { ...x, ...mudanca } : x)));

  const total = comanda.totalCentavos;
  // Total mudou (item editado/adicionado, desconto): com uma forma só, acompanha o novo total.
  const [totalAnterior, setTotalAnterior] = useState(total);
  if (totalAnterior !== total) {
    setTotalAnterior(total);
    if (pagamentos.length === 1) {
      setPagamentos([{ ...pagamentos[0], valor: centavosParaTexto(total) }]);
    }
  }
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
    const enviar = (confirmarCaixaFechado: boolean) =>
      fecharComanda(comanda.id, {
        confirmarCaixaFechado,
        pagamentos: pagamentos.map((p) => ({
          forma: p.forma,
          valorCentavos: textoParaCentavos(p.valor),
          ...(ehCartao(p.forma) && p.maquininhaId
            ? {
                maquininhaId: p.maquininhaId,
                parcelas: p.forma === 'CREDITO' ? p.parcelas : undefined,
              }
            : {}),
        })),
      });
    // Serviço "a partir de": o valor final precisa ser conferido antes de fechar.
    const aConferir = comanda.itens.filter((i) => i.precoAPartirDe);
    if (
      aConferir.length > 0 &&
      !confirm(
        [
          'Serviço com preço "a partir de":',
          ...aConferir.map((i) => `• ${i.descricao}: ${formatarPreco(i.valorCentavos)}`),
          '',
          'O valor cobrado está correto? Para mudar, toque no valor do item.',
        ].join('\n'),
      )
    ) {
      return;
    }
    setErro(null);
    iniciar(async () => {
      let r = await enviar(false);
      // Lançamento em data anterior cujo caixa já foi fechado: confirma e tenta de novo.
      if (!r.ok && r.codigo === 'CAIXA_DO_DIA_FECHADO') {
        if (!confirm(`${r.erro}\n\nDeseja continuar?`)) return;
        r = await enviar(true);
      }
      if (!r.ok) setErro(r.erro);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {cabecalho}
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
              <LinhaItem
                key={`${item.id}-${item.valorCentavos}-${item.profissional?.id ?? ''}`}
                item={item}
                profissionais={profissionais}
                pendente={pendente}
                aoSalvar={(dados) => executar(() => atualizarItem(comanda.id, item.id, dados))}
                aoRemover={() => executar(() => removerItem(comanda.id, item.id))}
                aoErro={setErro}
              />
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
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <select
                  value={p.forma}
                  onChange={(e) => alterarLinha(i, { forma: e.target.value as FormaPagamento })}
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
              {ehCartao(p.forma) && maquininhas.length > 0 && (
                <TaxaDoCartao
                  linha={p}
                  maquininhas={maquininhas}
                  aoMudar={(mudanca) => alterarLinha(i, mudanca)}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setPagamentos((l) => [...l, novaLinha('DINHEIRO', Math.max(0, total - somaPagos))])
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

/** Linha de item com edição inline de valor e profissional (serviço). */
function LinhaItem({
  item,
  profissionais,
  pendente,
  aoSalvar,
  aoRemover,
  aoErro,
}: {
  item: ItemComanda;
  profissionais: ProfissionalResumo[];
  pendente: boolean;
  aoSalvar: (dados: { valorCentavos?: number; profissionalId?: string }) => void;
  aoRemover: () => void;
  aoErro: (erro: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(centavosParaTexto(item.valorCentavos));
  const [profissionalId, setProfissionalId] = useState(item.profissional?.id ?? '');
  const servico = item.tipo === 'SERVICO';

  function salvar() {
    const valorCentavos = textoParaCentavos(valor);
    if (valorCentavos === null) {
      aoErro('Valor inválido. Ex.: 45,00');
      return;
    }
    const dados: { valorCentavos?: number; profissionalId?: string } = {};
    if (valorCentavos !== item.valorCentavos) dados.valorCentavos = valorCentavos;
    if (servico && profissionalId && profissionalId !== item.profissional?.id) {
      dados.profissionalId = profissionalId;
    }
    if (Object.keys(dados).length === 0) {
      setEditando(false);
      return;
    }
    aoSalvar(dados);
  }

  const descricao = (
    <span className="font-medium">
      {item.tipo === 'PRODUTO' && item.quantidade > 1 && `${item.quantidade}× `}
      {item.descricao}
    </span>
  );

  if (editando) {
    return (
      <li className="flex flex-col gap-2 px-3 py-2">
        {descricao}
        <div className="flex flex-wrap items-center gap-2">
          {servico && (
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              aria-label="Profissional"
              className={`${classeInput} min-w-0 flex-1`}
            >
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-1 text-suave">
            R$
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && salvar()}
              inputMode="decimal"
              aria-label={item.tipo === 'PRODUTO' ? 'Valor total' : 'Valor cobrado'}
              autoFocus
              className={`${classeInput} w-28`}
            />
          </label>
          <button
            type="button"
            disabled={pendente}
            onClick={salvar}
            className={classeBotaoSecundario}
          >
            Salvar
          </button>
          <button
            type="button"
            disabled={pendente}
            onClick={() => setEditando(false)}
            className="text-xs text-suave"
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <span className="flex min-w-0 flex-1 flex-col">
        {descricao}
        <span className="text-xs text-suave">
          {item.tipo === 'PRODUTO' ? 'Venda de produto' : item.profissional?.nome}
          {item.agendamentoId && ' · do agendamento'}
          {item.precoAPartirDe && (
            <span className="text-alerta"> · preço &ldquo;a partir de&rdquo;: confira o valor</span>
          )}
        </span>
      </span>
      <button
        type="button"
        disabled={pendente}
        onClick={() => setEditando(true)}
        title={servico ? 'Alterar valor ou profissional' : 'Alterar valor'}
        className="rounded-md px-1 underline decoration-dotted underline-offset-4 hover:text-primaria"
      >
        {formatarPreco(item.valorCentavos)}
      </button>
      <button
        type="button"
        disabled={pendente}
        onClick={() => setEditando(true)}
        className="text-xs text-primaria"
      >
        Editar
      </button>
      <button
        type="button"
        disabled={pendente}
        onClick={aoRemover}
        aria-label={`Remover ${item.descricao}`}
        className="px-1 text-suave"
      >
        ✕
      </button>
    </li>
  );
}

/** Maquininha e parcelas do pagamento no cartão, com a taxa que será aplicada. */
function TaxaDoCartao({
  linha,
  maquininhas,
  aoMudar,
}: {
  linha: LinhaPagamento;
  maquininhas: MaquininhaDto[];
  aoMudar: (mudanca: Partial<LinhaPagamento>) => void;
}) {
  const maquininha = maquininhas.find((m) => m.id === linha.maquininhaId);
  const taxaBps = !maquininha
    ? null
    : linha.forma === 'DEBITO'
      ? maquininha.taxaDebitoBps
      : (maquininha.taxasCreditoBps[linha.parcelas - 1] ?? 0);
  const valor = textoParaCentavos(linha.valor) ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-2 pl-1 text-xs text-suave">
      <select
        value={linha.maquininhaId}
        onChange={(e) => aoMudar({ maquininhaId: e.target.value })}
        aria-label="Maquininha"
        className="rounded-md border border-borda bg-transparent px-2 py-1 text-sm text-foreground"
      >
        {maquininhas.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome}
          </option>
        ))}
      </select>
      {linha.forma === 'CREDITO' && (
        <select
          value={linha.parcelas}
          onChange={(e) => aoMudar({ parcelas: Number(e.target.value) })}
          aria-label="Parcelas"
          className="rounded-md border border-borda bg-transparent px-2 py-1 text-sm text-foreground"
        >
          {Array.from({ length: PARCELAS_MAXIMAS }, (_, k) => k + 1).map((n) => (
            <option key={n} value={n}>
              {n === 1 ? 'À vista (1x)' : `${n}x`}
            </option>
          ))}
        </select>
      )}
      {taxaBps !== null && (
        <span>
          taxa {formatarPercentual(taxaBps)} ={' '}
          {formatarPreco(Math.round((valor * taxaBps) / 10_000))}
        </span>
      )}
    </div>
  );
}
