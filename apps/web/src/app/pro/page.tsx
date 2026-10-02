import { EmConstrucao } from '@/components/em-construcao';
import { sair } from '@/lib/auth/actions';
import { obterContextoPro } from '@/lib/auth/contexto';

export default async function ProAgendaPage() {
  const { perfil, salao } = await obterContextoPro();

  if (!salao) {
    return (
      <section className="flex flex-col gap-4 text-center">
        <EmConstrucao
          titulo="Você ainda não está em nenhum salão"
          descricao={`Peça ao salão para adicionar ${perfil.email} como profissional. Depois, é só abrir este app de novo.`}
        />
        <form action={sair}>
          <button type="submit" className="text-sm text-suave underline">
            Sair
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-suave">{salao.nome}</p>
        <h1 className="text-2xl font-bold">Minha agenda</h1>
      </div>
      <EmConstrucao
        titulo="Atendimentos do dia"
        descricao="Seus atendimentos, comissão do período e valores a receber."
      />
    </section>
  );
}
