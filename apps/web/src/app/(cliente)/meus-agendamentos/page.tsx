import { EmConstrucao } from '@/components/em-construcao';

export const metadata = { title: 'Meus agendamentos' };

export default function MeusAgendamentosPage() {
  return (
    <EmConstrucao
      titulo="Meus agendamentos"
      descricao="Agendamentos em todos os salões, com opção de remarcar e cancelar."
    />
  );
}
