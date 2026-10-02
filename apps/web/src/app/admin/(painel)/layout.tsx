import Link from 'next/link';
import { sair, trocarSalao } from '@/lib/auth/actions';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { env } from '@/lib/env';

const menu = [
  { rotulo: 'Início', href: '/admin' },
  { rotulo: 'Agenda' },
  { rotulo: 'Comandas' },
  { rotulo: 'Clientes' },
  { rotulo: 'Profissionais', href: '/admin/profissionais' },
  { rotulo: 'Serviços' },
  { rotulo: 'Estoque' },
  { rotulo: 'Comissões' },
  { rotulo: 'Financeiro' },
  { rotulo: 'Configurações' },
];

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { perfil, salao } = await obterContextoAdmin();
  const outrosSaloes = perfil.saloes.filter(
    (s) => s.id !== salao.id && (s.papel === 'DONO' || s.papel === 'RECEPCAO'),
  );

  return (
    <div className="flex flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-borda p-4 md:flex">
        <p className="text-lg font-bold text-primaria">SalonFlow</p>
        <p className="mt-1 mb-6 truncate text-sm font-medium" title={salao.nome}>
          {salao.nome}
        </p>

        <nav className="flex flex-col gap-1 text-sm">
          {menu.map((item) =>
            item.href ? (
              <Link key={item.rotulo} href={item.href} className="rounded-md px-3 py-2 font-medium">
                {item.rotulo}
              </Link>
            ) : (
              <span key={item.rotulo} className="px-3 py-2 text-suave" title="Em breve">
                {item.rotulo}
              </span>
            ),
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-borda pt-4 text-sm">
          {outrosSaloes.length > 0 && (
            <form action={trocarSalao} className="flex flex-col gap-1">
              <label htmlFor="salaoId" className="text-xs text-suave">
                Trocar de salão
              </label>
              <div className="flex gap-1">
                <select
                  id="salaoId"
                  name="salaoId"
                  className="min-w-0 flex-1 rounded-md border border-borda bg-transparent px-2 py-1"
                >
                  {outrosSaloes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded-md border border-borda px-2">
                  Ir
                </button>
              </div>
            </form>
          )}
          <p className="truncate text-xs text-suave" title={perfil.email}>
            {perfil.nome ?? perfil.email}
          </p>
          {env.loginComSenha && (
            <Link href="/conta/senha" className="text-xs text-amber-700 underline">
              Definir senha (dev)
            </Link>
          )}
          <form action={sair}>
            <button type="submit" className="text-suave underline">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-borda px-4 py-3 md:hidden">
          <span className="truncate font-semibold">{salao.nome}</span>
          <form action={sair}>
            <button type="submit" className="text-sm text-suave">
              Sair
            </button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
