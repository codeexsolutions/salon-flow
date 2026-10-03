import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { criarSupabaseServer } from '@/lib/supabase/server';

/** Pede a troca da senha enquanto a pessoa usa a senha criada pelo salão. */
export async function AvisoSenhaProvisoria({ href }: { href: string }) {
  const { data } = await (await criarSupabaseServer()).auth.getClaims();
  const metadados = data?.claims.user_metadata as { senha_provisoria?: boolean } | undefined;
  if (!metadados?.senha_provisoria) return null;

  return (
    <Link
      href={href}
      className="mb-4 flex items-start gap-3 rounded-2xl bg-alerta-suave p-4 text-sm text-alerta"
    >
      <KeyRound className="mt-0.5 size-5 shrink-0" aria-hidden />
      <span>
        <strong className="block">Você está usando a senha criada pelo salão.</strong>
        Toque aqui para criar a sua senha.
      </span>
    </Link>
  );
}
