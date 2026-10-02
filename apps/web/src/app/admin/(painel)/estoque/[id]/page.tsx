import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatarPreco, type MovimentoEstoqueDto, type ProdutoResumo } from '@salonflow/shared';
import { FormProduto } from '@/components/estoque/form-produto';
import { MovimentarEstoque } from '@/components/estoque/movimentar-estoque';
import { classeBotaoSecundario } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { dataLocal, horaLocal } from '@/lib/data-hora';
import { emEmbalagens, formatarQuantidade, ROTULO_MOVIMENTO } from '@/lib/estoque';
import { alterarAtivoProduto } from '../actions';

async function carregar(id: string) {
  try {
    return await Promise.all([
      apiSalao<ProdutoResumo>(`/produtos/${id}`),
      apiSalao<MovimentoEstoqueDto[]>(`/produtos/${id}/movimentos`),
    ]);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }
}

export default async function ProdutoPage({ params }: PageProps<'/admin/estoque/[id]'>) {
  const { id } = await params;
  const [{ salao }, [produto, movimentos]] = await Promise.all([
    obterContextoAdmin(),
    carregar(id),
  ]);
  const ehDono = salao.papel === 'DONO';
  const fuso = salao.fusoHorario;

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <Link href="/admin/estoque" className="text-sm text-suave">
          ← Estoque
        </Link>
        <h1 className="mt-2 text-3xl">{produto.nome}</h1>
        <p className={`text-sm ${produto.estoqueBaixo ? 'text-alerta' : 'text-suave'}`}>
          Saldo: <strong>{formatarQuantidade(produto.estoqueAtual, produto.unidade)}</strong>{' '}
          {emEmbalagens(produto.estoqueAtual, produto.tamanhoEmbalagem)}
          {produto.estoqueBaixo && ' · abaixo do mínimo'}
          {' · custo da embalagem '}
          {formatarPreco(produto.custoEmbalagemCentavos)}
        </p>
      </div>

      {produto.ativo && (
        <Secao titulo="Entrada ou ajuste">
          <MovimentarEstoque produto={produto} />
        </Secao>
      )}

      <Secao titulo="Histórico" descricao="Últimas 100 movimentações.">
        {movimentos.length === 0 ? (
          <p className="text-sm text-suave">Nenhuma movimentação ainda.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borda text-sm">
            {movimentos.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2">
                <span className="w-24 shrink-0 text-xs text-suave">
                  {dataLocal(m.criadoEm, fuso).split('-').reverse().slice(0, 2).join('/')}{' '}
                  {horaLocal(m.criadoEm, fuso)}
                </span>
                <span className="flex-1">
                  {ROTULO_MOVIMENTO[m.tipo]}
                  {m.comandaNumero !== null && (
                    <span className="text-suave"> · comanda #{m.comandaNumero}</span>
                  )}
                  {m.observacao && <span className="text-suave"> · {m.observacao}</span>}
                </span>
                <span className={m.quantidade < 0 ? 'text-perigo' : 'text-sucesso'}>
                  {m.quantidade > 0 ? '+' : ''}
                  {formatarQuantidade(m.quantidade, produto.unidade)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {ehDono && (
        <>
          <Secao titulo="Dados do produto">
            <FormProduto produto={produto} />
          </Secao>
          <Secao
            titulo={produto.ativo ? 'Desativar produto' : 'Reativar produto'}
            descricao={
              produto.ativo
                ? 'Some das listas e das fichas técnicas novas. O histórico é mantido.'
                : 'Volta a poder ser usado e vendido.'
            }
          >
            <form action={alterarAtivoProduto.bind(null, produto.id, !produto.ativo)}>
              <button
                type="submit"
                className={
                  produto.ativo ? `${classeBotaoSecundario} text-perigo` : classeBotaoSecundario
                }
              >
                {produto.ativo ? 'Desativar' : 'Reativar'}
              </button>
            </form>
          </Secao>
        </>
      )}
    </div>
  );
}
