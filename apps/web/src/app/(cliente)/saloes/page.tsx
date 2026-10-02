import Link from 'next/link';
import { ChevronLeft, ChevronRight, Search, Store } from 'lucide-react';
import type { FiltrosDiretorio, Paginado, SalaoMarketplace } from '@salonflow/shared';
import { CartaoSalao } from '@/components/cliente/cartao-salao';
import { classeBotaoPrimario, classeBotaoSecundario } from '@/components/ui/campo';
import { EstadoVazio } from '@/components/ui/estado-vazio';
import { api } from '@/lib/api/client';

export const metadata = {
  title: 'Salões',
  description: 'Encontre salões de beleza e barbearias e agende online.',
};

type Consulta = { busca?: string; cidade?: string; categoria?: string; pagina?: string };

function montarUrl(consulta: Consulta, mudancas: Partial<Consulta>) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries({ ...consulta, ...mudancas })) {
    if (valor) params.set(chave, String(valor));
  }
  const texto = params.toString();
  return `/saloes${texto ? `?${texto}` : ''}`;
}

/** Diretório público de salões: busca, filtros por cidade e tipo de serviço, paginação. */
export default async function SaloesPage({ searchParams }: PageProps<'/saloes'>) {
  const bruto = await searchParams;
  const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  const consulta: Consulta = {
    busca: texto(bruto.busca),
    cidade: texto(bruto.cidade),
    categoria: texto(bruto.categoria),
    pagina: texto(bruto.pagina),
  };

  const params = new URLSearchParams(
    Object.entries(consulta).filter((e): e is [string, string] => !!e[1]),
  );
  const [resultado, filtros] = await Promise.all([
    api<Paginado<SalaoMarketplace>>(`/saloes?${params}`, { cache: 'no-store' }).catch(
      () => ({ itens: [], total: 0, pagina: 1, porPagina: 12 }) as Paginado<SalaoMarketplace>,
    ),
    api<FiltrosDiretorio>('/saloes/filtros', { cache: 'no-store' }).catch(
      () => ({ cidades: [], categorias: [] }) as FiltrosDiretorio,
    ),
  ]);
  const totalPaginas = Math.max(1, Math.ceil(resultado.total / resultado.porPagina));
  const temFiltro = !!(consulta.busca || consulta.cidade || consulta.categoria);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl">Salões</h1>
        <p className="text-sm text-suave">
          {resultado.total} {resultado.total === 1 ? 'salão encontrado' : 'salões encontrados'}
        </p>
      </header>

      <form className="grid gap-2 rounded-2xl border border-borda bg-superficie p-3 sm:grid-cols-[1fr_14rem_auto]">
        <label className="flex items-center gap-2 rounded-xl px-2">
          <Search className="size-5 shrink-0 text-suave" aria-hidden />
          <input
            name="busca"
            defaultValue={consulta.busca}
            placeholder="Nome do salão ou bairro"
            aria-label="Buscar"
            className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-suave/70"
          />
        </label>
        <select
          name="cidade"
          defaultValue={consulta.cidade ?? ''}
          aria-label="Cidade"
          className="rounded-xl border border-borda bg-superficie px-3 py-2"
        >
          <option value="">Todas as cidades</option>
          {filtros.cidades.map((c) => (
            <option key={`${c.cidade}-${c.uf}`} value={c.cidade}>
              {c.cidade}
              {c.uf && ` - ${c.uf}`} ({c.total})
            </option>
          ))}
        </select>
        {consulta.categoria && <input type="hidden" name="categoria" value={consulta.categoria} />}
        <button type="submit" className={classeBotaoPrimario}>
          Buscar
        </button>
      </form>

      {filtros.categorias.length > 0 && (
        <nav aria-label="Tipos de serviço" className="flex gap-2 overflow-x-auto pb-1">
          {[undefined, ...filtros.categorias].map((categoria) => {
            const ativo = consulta.categoria?.toLowerCase() === categoria?.toLowerCase();
            return (
              <Link
                key={categoria ?? 'todas'}
                href={montarUrl(consulta, { categoria, pagina: undefined })}
                aria-current={ativo ? 'true' : undefined}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
                  ativo
                    ? 'border-primaria bg-primaria text-primaria-contraste'
                    : 'border-borda bg-superficie hover:border-primaria/40'
                }`}
              >
                {categoria ?? 'Todos'}
              </Link>
            );
          })}
        </nav>
      )}

      {resultado.itens.length === 0 ? (
        <EstadoVazio
          icone={Store}
          titulo="Nenhum salão encontrado"
          descricao={temFiltro ? 'Tente outra busca, cidade ou tipo de serviço.' : 'Os salões cadastrados aparecem aqui.'}
          acao={
            temFiltro ? (
              <Link href="/saloes" className={classeBotaoSecundario}>
                Limpar filtros
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultado.itens.map((s) => (
            <li key={s.id}>
              <CartaoSalao salao={s} />
            </li>
          ))}
        </ul>
      )}

      {totalPaginas > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-center gap-3 text-sm">
          {resultado.pagina > 1 ? (
            <Link
              href={montarUrl(consulta, { pagina: String(resultado.pagina - 1) })}
              className={classeBotaoSecundario}
            >
              <ChevronLeft className="size-4" aria-hidden /> Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-suave">
            Página {resultado.pagina} de {totalPaginas}
          </span>
          {resultado.pagina < totalPaginas && (
            <Link
              href={montarUrl(consulta, { pagina: String(resultado.pagina + 1) })}
              className={classeBotaoSecundario}
            >
              Próxima <ChevronRight className="size-4" aria-hidden />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
