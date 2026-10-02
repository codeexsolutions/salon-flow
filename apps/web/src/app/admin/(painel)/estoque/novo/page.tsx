import Link from 'next/link';
import { FormProduto } from '@/components/estoque/form-produto';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Novo produto' };

export default async function NovoProdutoPage() {
  const { salao } = await obterContextoAdmin();
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/admin/estoque" className="text-sm text-suave">
          ← Estoque
        </Link>
        <h1 className="mt-2 text-3xl">Novo produto</h1>
      </div>
      {salao.papel === 'DONO' ? (
        <FormProduto />
      ) : (
        <p className="text-sm text-suave">Apenas o dono do salão pode cadastrar produtos.</p>
      )}
    </div>
  );
}
