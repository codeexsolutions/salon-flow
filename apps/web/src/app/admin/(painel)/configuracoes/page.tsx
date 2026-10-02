import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { SalaoConfiguracao } from '@salonflow/shared';
import { FormSalao } from '@/components/configuracoes/form-salao';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { classeBotaoSecundario } from '@/components/ui/campo';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Configurações' };

export default async function ConfiguracoesPage() {
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') {
    return <p className="text-sm text-suave">Apenas o dono do salão altera as configurações.</p>;
  }
  const dados = await apiSalao<SalaoConfiguracao>('/saloes/atual');

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <CabecalhoPagina
        titulo="Configurações"
        subtitulo="Como o seu salão aparece para os clientes."
        acoes={
          <Link href={`/s/${dados.slug}`} target="_blank" className={classeBotaoSecundario}>
            Ver página do salão <ExternalLink className="size-4" aria-hidden />
          </Link>
        }
      />
      <FormSalao salao={dados} />
    </div>
  );
}
