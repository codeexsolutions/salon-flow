import Link from 'next/link';
import { EmConstrucao } from '@/components/em-construcao';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export default async function AdminInicioPage() {
  const { perfil, salao } = await obterContextoAdmin();
  const primeiroNome = perfil.nome?.split(' ')[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Olá{primeiroNome && `, ${primeiroNome}`}!</h1>
        <p className="text-sm text-suave">
          Página pública do salão:{' '}
          <Link href={`/s/${salao.slug}`} className="text-primaria underline">
            /s/{salao.slug}
          </Link>
        </p>
      </div>
      <EmConstrucao
        titulo="Resumo do dia"
        descricao="Agenda, faturamento e atendimentos aparecerão aqui."
      />
    </div>
  );
}
