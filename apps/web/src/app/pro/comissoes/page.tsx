import {
  dataLocalSchema,
  formatarPercentual,
  formatarPreco,
  type ExtratoComissoes,
} from '@salonflow/shared';
import { api } from '@/lib/api/client';
import { obterContextoPro } from '@/lib/auth/contexto';
import { exigirSessao } from '@/lib/auth/sessao';
import { dataLocal, hojeNoFuso, horaLocal } from '@/lib/data-hora';

export const metadata = { title: 'Minhas comissões' };

export default async function ProComissoesPage({ searchParams }: PageProps<'/pro/comissoes'>) {
  const { salao } = await obterContextoPro();
  if (!salao) {
    return <p className="text-sm text-suave">Você ainda não está vinculado a um salão.</p>;
  }

  const hoje = hojeNoFuso(salao.fusoHorario);
  const consulta = await searchParams;
  const valida = (v: unknown, padrao: string) =>
    dataLocalSchema.safeParse(v).success ? (v as string) : padrao;
  const de = valida(consulta.de, `${hoje.slice(0, 8)}01`);
  const ate = valida(consulta.ate, hoje);

  const sessao = await exigirSessao('/pro/comissoes');
  const extrato = await api<ExtratoComissoes>(`/pro/comissoes?de=${de}&ate=${ate}`, {
    token: sessao.token,
    salaoId: salao.id,
    cache: 'no-store',
  });
  const meu = extrato.profissionais[0];
  const fuso = salao.fusoHorario;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-suave">{salao.nome}</p>
        <h1 className="text-2xl font-bold">Minhas comissões</h1>
      </div>

      <form className="flex items-end gap-2 text-sm">
        <label className="flex flex-col gap-1">
          De
          <input
            type="date"
            name="de"
            defaultValue={de}
            className="rounded-md border border-borda bg-transparent px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Até
          <input
            type="date"
            name="ate"
            defaultValue={ate}
            className="rounded-md border border-borda bg-transparent px-2 py-1"
          />
        </label>
        <button type="submit" className="rounded-md border border-borda px-3 py-1">
          Ver
        </button>
      </form>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-borda p-4">
          <p className="text-xs text-suave">Comissão no período</p>
          <p className="text-2xl font-bold text-primaria">
            {formatarPreco(meu?.totalComissaoCentavos ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-borda p-4">
          <p className="text-xs text-suave">Atendimentos</p>
          <p className="text-2xl font-bold">{meu?.quantidade ?? 0}</p>
          <p className="text-xs text-suave">
            {formatarPreco(meu?.totalServicosCentavos ?? 0)} em serviços
          </p>
        </div>
      </div>

      {!meu ? (
        <p className="rounded-xl border border-dashed border-borda p-6 text-center text-sm text-suave">
          Nenhum atendimento fechado no período.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {meu.itens.map((i) => (
            <li
              key={i.itemId}
              className="flex items-center gap-3 rounded-xl border border-borda p-3 text-sm"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{i.descricao}</span>
                <span className="text-xs text-suave">
                  {dataLocal(i.fechadaEm, fuso).split('-').reverse().slice(0, 2).join('/')}{' '}
                  {horaLocal(i.fechadaEm, fuso)}
                  {i.cliente && ` · ${i.cliente}`} · {formatarPercentual(i.comissaoBps)} de{' '}
                  {formatarPreco(i.baseComissaoCentavos)}
                </span>
              </span>
              <span className="font-semibold">{formatarPreco(i.comissaoCentavos)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
