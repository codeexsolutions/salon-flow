import { EmConstrucao } from '@/components/em-construcao';
import { exigirSessao } from '@/lib/auth/sessao';

export const metadata = { title: 'Meus agendamentos' };

export default async function MeusAgendamentosPage() {
  await exigirSessao('/meus-agendamentos');

  return (
    <EmConstrucao
      titulo="Meus agendamentos"
      descricao="Agendamentos em todos os salões, com opção de remarcar e cancelar."
    />
  );
}
