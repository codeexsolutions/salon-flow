import Link from 'next/link';
import { Bell } from 'lucide-react';
import { DIAS_GUARDAR_NOTIFICACAO, type NotificacaoDto } from '@salonflow/shared';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { EstadoVazio } from '@/components/ui/estado-vazio';
import { api } from '@/lib/api/client';
import { exigirSessao } from '@/lib/auth/sessao';
import { limparNotificacoes } from './actions';

export const metadata = { title: 'Notificações' };

function quando(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default async function NotificacoesPage() {
  const sessao = await exigirSessao('/notificacoes');
  const lista = await api<NotificacaoDto[]>('/me/notificacoes', {
    token: sessao.token,
    cache: 'no-store',
  }).catch(() => [] as NotificacaoDto[]);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <CabecalhoPagina
        titulo="Notificações"
        subtitulo={`Ao abrir, a notificação sai daqui. As não abertas somem em ${DIAS_GUARDAR_NOTIFICACAO} dias.`}
        acoes={
          lista.length > 0 && (
            <form action={limparNotificacoes}>
              <button type="submit" className="text-sm text-suave underline hover:text-primaria">
                Limpar todas
              </button>
            </form>
          )
        }
      />
      {lista.length === 0 ? (
        <EstadoVazio icone={Bell} titulo="Nenhuma notificação" />
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((n) => (
            <li key={n.id}>
              <Link
                href={`/notificacoes/abrir/${n.id}`}
                prefetch={false}
                className="flex gap-3 rounded-xl border border-borda bg-superficie p-3 transition hover:border-primaria/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-nude text-primaria">
                  <Bell className="size-4" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium">{n.titulo}</span>
                  <span className="text-sm text-suave">{n.corpo}</span>
                  <span className="text-xs text-suave">{quando(n.criadoEm)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
