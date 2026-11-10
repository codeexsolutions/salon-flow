import Link from 'next/link';
import type { MeuAgendamento, PerfilCliente } from '@salonflow/shared';
import { CartaoAgendamento } from '@/components/cliente/cartao-agendamento';
import { AtivarNotificacoes } from '@/components/pwa/ativar-notificacoes';
import { ConviteInstalarApp } from '@/components/pwa/convite-instalar-app';
import { api } from '@/lib/api/client';
import { exigirSessao } from '@/lib/auth/sessao';
import { chavePublicaPush } from '@/lib/push/chave';

export const metadata = { title: 'Meus agendamentos' };

/** Carrega os agendamentos e separa os próximos (em aberto) do histórico. */
async function carregar() {
  const sessao = await exigirSessao('/meus-agendamentos');
  const lista = await api<MeuAgendamento[]>('/me/agendamentos', {
    token: sessao.token,
    cache: 'no-store',
  });

  // Cadastro incompleto: convite (opcional) para completar. API antiga: não mostra.
  const perfil = await api<PerfilCliente>('/me/perfil-cliente', {
    token: sessao.token,
    cache: 'no-store',
  }).catch(() => null);
  const convidarCadastro = !!perfil && (!perfil.telefone || !perfil.nascimento);

  const agora = Date.now();
  const proximos = lista.filter(
    (a) => new Date(a.fim).getTime() >= agora && ['AGENDADO', 'CONFIRMADO'].includes(a.status),
  );
  return {
    proximos,
    historico: lista.filter((a) => !proximos.includes(a)).reverse(),
    convidarCadastro,
  };
}

export default async function MeusAgendamentosPage() {
  const [{ proximos, historico, convidarCadastro }, chavePush] = await Promise.all([
    carregar(),
    chavePublicaPush(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl">Meus agendamentos</h1>
        {(proximos.length > 0 || historico.length > 0) && (
          <AtivarNotificacoes chavePublica={chavePush} />
        )}
        {convidarCadastro && (
          <Link
            href="/conta/dados"
            className="rounded-xl border border-primaria/30 bg-nude/50 px-4 py-3 text-sm hover:border-primaria/60"
          >
            <strong>Complete seu cadastro (opcional):</strong> celular e data de nascimento vão para
            todos os salões em que você agenda.
          </Link>
        )}
        {/* Convite para instalar o app só depois do primeiro agendamento. */}
        {(proximos.length > 0 || historico.length > 0) && <ConviteInstalarApp />}
        {proximos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-borda p-6 text-center text-sm text-suave">
            Você não tem agendamentos marcados.{' '}
            <Link href="/saloes" className="text-primaria underline">
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
