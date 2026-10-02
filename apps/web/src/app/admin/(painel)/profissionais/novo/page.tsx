import Link from 'next/link';
import { FormProfissional } from '@/components/profissionais/form-profissional';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Novo profissional' };

export default async function NovoProfissionalPage() {
  const { salao } = await obterContextoAdmin();

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <Link href="/admin/profissionais" className="text-sm text-suave">
          ← Profissionais
        </Link>
        <h1 className="mt-2 text-3xl">Novo profissional</h1>
      </div>
      {salao.papel === 'DONO' ? (
        <FormProfissional />
      ) : (
        <p className="text-sm text-suave">Apenas o dono do salão pode cadastrar profissionais.</p>
      )}
    </div>
  );
}
