import Link from 'next/link';
import type { MeuAgendamento } from '@salonflow/shared';
import { CartaoAgendamento } from '@/components/cliente/cartao-agendamento';
import { api } from '@/lib/api/client';
import { exigirSessao } from '@/lib/auth/sessao';

export const metadata = { title: 'Meus agendamentos' };

/** Carrega os agendamentos e separa os próximos (em aberto) do histórico. */
async function carregar() {
  const sessao = await exigirSessao('/meus-agendamentos');
  const lista = await api<MeuAgendamento[]>('/me/agendamentos', {
    token: sessao.token,
    cache: 'no-store',
  });

  const agora = Date.now();
  const proximos = lista.filter(
    (a) => new Date(a.fim).getTime() >= agora && ['AGENDADO', 'CONFIRMADO'].includes(a.status),
  );
  return { proximos, historico: lista.filter((a) => !proximos.includes(a)).reverse() };
}

export default async function MeusAgendamentosPage() {
  const { proximos, historico } = await carregar();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl">Meus agendamentos</h1>
        {proximos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-borda p-6 text-center text-sm text-suave">
            Você não tem agendamentos marcados.{' '}
            <Link href="/" className="text-primaria underline">
              Encontre um salão
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {proximos.map((a) => (
              <CartaoAgendamento key={a.id} agendamento={a} />
            ))}
          </ul>
        )}
      </section>

      {historico.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Histórico</h2>
          <ul className="flex flex-col gap-3">
            {historico.map((a) => (
              <CartaoAgendamento key={a.id} agendamento={a} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
