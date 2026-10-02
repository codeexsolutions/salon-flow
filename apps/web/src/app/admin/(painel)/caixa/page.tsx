import Link from 'next/link';
import { formatarPreco, type CaixaDetalhe } from '@salonflow/shared';
import { AbrirCaixa, CaixaAberto } from '@/components/caixa/painel-caixa';
import { Secao } from '@/components/ui/secao';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { dataLocal, hojeNoFuso, horaLocal, somarDias } from '@/lib/data-hora';

export const metadata = { title: 'Caixa' };

export default async function CaixaPage() {
  const { salao } = await obterContextoAdmin();
  const fuso = salao.fusoHorario;
  const hoje = hojeNoFuso(fuso);
  const [{ caixa }, historico] = await Promise.all([
    apiSalao<{ caixa: CaixaDetalhe | null }>('/caixa/atual'),
    apiSalao<CaixaDetalhe[]>(`/caixa/historico?de=${somarDias(hoje, -30)}&ate=${hoje}`),
  ]);
  const fechados = historico.filter((c) => c.status === 'FECHADO');

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Caixa</h1>

      {caixa ? <CaixaAberto key={caixa.id} caixa={caixa} fusoHorario={fuso} /> : <AbrirCaixa />}

      <Secao titulo="Últimos 30 dias">
        {fechados.length === 0 ? (
          <p className="text-sm text-suave">Nenhum caixa fechado no período.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-borda text-sm">
            {fechados.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/caixa/${c.id}`} className="flex items-center gap-3 py-2">
                  <span className="flex-1">
                    {dataLocal(c.abertoEm, fuso).split('-').reverse().join('/')}{' '}
                    <span className="text-suave">
                      {horaLocal(c.abertoEm, fuso)}–{c.fechadoEm && horaLocal(c.fechadoEm, fuso)}
                    </span>
                  </span>
                  <span>{formatarPreco(c.totalRecebidoCentavos)}</span>
                  <span
                    className={`w-28 text-right ${c.diferencaCentavos ? 'text-alerta' : 'text-sucesso'}`}
                  >
                    {c.diferencaCentavos
                      ? `dif. ${formatarPreco(c.diferencaCentavos)}`
                      : 'conferido'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Secao>
    </div>
  );
}
