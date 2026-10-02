import Link from 'next/link';
import type { ServicoResumo } from '@salonflow/shared';
import { FormServico } from '@/components/servicos/form-servico';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { categoriasDe } from '../categorias';

export const metadata = { title: 'Novo serviço' };

export default async function NovoServicoPage() {
  const [{ salao }, servicos] = await Promise.all([
    obterContextoAdmin(),
    apiSalao<ServicoResumo[]>('/servicos?incluirInativos=true'),
  ]);

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link href="/admin/servicos" className="text-sm text-suave">
          ← Serviços
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Novo serviço</h1>
      </div>
      {salao.papel === 'DONO' ? (
        <FormServico categorias={categoriasDe(servicos)} />
      ) : (
        <p className="text-sm text-suave">Apenas o dono do salão pode cadastrar serviços.</p>
      )}
    </div>
  );
}
