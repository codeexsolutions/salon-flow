import { notFound } from 'next/navigation';
import type { ServicoResumo, SugestaoContrato } from '@salonflow/shared';
import { FormContrato } from '@/components/contratos/form-contrato';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Novo contrato' };

export default async function NovoContratoPage({
  searchParams,
}: PageProps<'/admin/contratos/novo'>) {
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') {
    return <p className="text-sm text-suave">Apenas o dono do salão acessa os contratos.</p>;
  }
  const { profissional } = await searchParams;
  if (typeof profissional !== 'string') notFound();

  let sugestao: SugestaoContrato;
  try {
    sugestao = await apiSalao<SugestaoContrato>(`/contratos/sugestao/${profissional}`);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }
  const servicos = await apiSalao<ServicoResumo[]>('/servicos');

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <CabecalhoPagina
        titulo={`Contrato · ${sugestao.profissionalNome}`}
        subtitulo="Preencha os dados, salve como rascunho e gere o contrato para imprimir."
        voltar={{ href: '/admin/contratos', rotulo: 'Contratos' }}
      />
      <FormContrato id={null} inicial={sugestao} servicos={servicos} />
    </div>
  );
}
