import Link from 'next/link';
import { EmConstrucao } from '@/components/em-construcao';

export default function InicioClientePage() {
  return (
    <div className="flex flex-col gap-6">
      <EmConstrucao
        titulo="Encontre um salão"
        descricao="Busca de salões por cidade, localização e serviço (marketplace)."
      />
      <Link
        href="/admin/novo-salao"
        className="rounded-xl border border-borda p-4 text-center text-sm"
      >
        Tem um salão ou barbearia? <strong className="text-primaria">Cadastre grátis</strong>
      </Link>
    </div>
  );
}
