'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { contarNotificacoes } from '@/app/(cliente)/notificacoes/actions';

/** Sino do cabeçalho com a quantidade de notificações não abertas. */
export function SinoNotificacoes() {
  const caminho = usePathname();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let ativo = true;
    contarNotificacoes()
      .then((n) => ativo && setTotal(n))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [caminho]);

  return (
    <Link
      href="/notificacoes"
      className="relative inline-flex items-center hover:text-primaria"
      aria-label={total > 0 ? `Notificações (${total} novas)` : 'Notificações'}
    >
      <Bell className="size-5" aria-hidden />
      {total > 0 && (
        <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-perigo px-1 text-[10px] font-semibold text-white">
          {total > 9 ? '9+' : total}
        </span>
      )}
    </Link>
  );
}
