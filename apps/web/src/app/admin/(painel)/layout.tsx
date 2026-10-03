import { Suspense } from 'react';
import { AvisoSenhaProvisoria } from '@/components/auth/aviso-senha-provisoria';
import { NavegacaoPainel } from '@/components/painel/navegacao-painel';
import { obterContextoAdmin, usaPainel } from '@/lib/auth/contexto';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { perfil, salao } = await obterContextoAdmin();
  const outrosSaloes = perfil.saloes.filter(
    (s) => s.id !== salao.id && usaPainel(s),
  );

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <NavegacaoPainel
        salao={salao}
        outrosSaloes={outrosSaloes}
        usuario={{ nome: perfil.nome, usuario: perfil.usuario }}
      />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 print:p-0">
        <Suspense>
          <AvisoSenhaProvisoria href="/conta/senha" />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
