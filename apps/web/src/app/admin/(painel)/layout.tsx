import { NavegacaoPainel } from '@/components/painel/navegacao-painel';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { perfil, salao } = await obterContextoAdmin();
  const outrosSaloes = perfil.saloes.filter(
    (s) => s.id !== salao.id && (s.papel === 'DONO' || s.papel === 'RECEPCAO'),
  );

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <NavegacaoPainel
        salao={salao}
        outrosSaloes={outrosSaloes}
        usuario={{ nome: perfil.nome, email: perfil.email }}
      />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 print:p-0">{children}</main>
    </div>
  );
}
