import { NovoCliente } from '@/components/clientes/novo-cliente';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { Secao } from '@/components/ui/secao';
import { obterContextoAdmin, pode } from '@/lib/auth/contexto';

export const metadata = { title: 'Novo cliente' };

export default async function NovoClientePage() {
  const { salao } = await obterContextoAdmin();
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <CabecalhoPagina
        titulo="Novo cliente"
        voltar={{ href: '/admin/clientes', rotulo: 'Clientes' }}
      />
      <Secao titulo="Dados do cliente">
        <NovoCliente abrirFicha={pode(salao, 'CLIENTES')} />
      </Secao>
    </div>
  );
}
