import Link from 'next/link';
import { formatarPreco, type ProdutoResumo } from '@salonflow/shared';
import { classeBotaoPrimario } from '@/components/ui/campo';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { emEmbalagens, formatarQuantidade } from '@/lib/estoque';

export const metadata = { title: 'Estoque' };

export default async function EstoquePage() {
  const [{ salao }, produtos] = await Promise.all([
    obterContextoAdmin(),
    apiSalao<ProdutoResumo[]>('/produtos?incluirInativos=true'),
  ]);
  const baixos = produtos.filter((p) => p.estoqueBaixo);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Estoque</h1>
        {salao.papel === 'DONO' && (
          <Link href="/admin/estoque/novo" className={classeBotaoPrimario}>
            Novo produto
          </Link>
        )}
      </div>

      {baixos.length > 0 && (
        <p
          role="status"
          className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
          <strong>Estoque baixo:</strong> {baixos.map((p) => p.nome).join(', ')}.
        </p>
      )}

      {produtos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda p-8 text-center text-sm text-suave">
          Nenhum produto cadastrado. Cadastre os produtos usados nos serviços e os de revenda.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda">
          {produtos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/estoque/${p.id}`}
                className={`flex items-center gap-3 px-4 py-3 ${p.ativo ? '' : 'opacity-50'}`}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">
                    {p.nome}
                    {p.marca && <span className="font-normal text-suave"> · {p.marca}</span>}
                  </span>
                  <span className="text-xs text-suave">
                    {p.precoVendaCentavos !== null
                      ? `Venda ${formatarPreco(p.precoVendaCentavos)}`
                      : 'Uso interno'}
                    {!p.ativo && ' · desativado'}
                  </span>
                </span>
                <span className="text-right">
                  <span
                    className={`block font-medium ${p.estoqueBaixo || p.estoqueAtual < 0 ? 'text-amber-700' : ''}`}
                  >
                    {formatarQuantidade(p.estoqueAtual, p.unidade)}
                  </span>
                  <span className="block text-xs text-suave">
                    {emEmbalagens(p.estoqueAtual, p.tamanhoEmbalagem)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
