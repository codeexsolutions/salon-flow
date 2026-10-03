'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { recuperarSenha } from '@/lib/auth/recuperacao-actions';
import { Campo, classeBotaoPrimario, classeInput } from '@/components/ui/campo';
import { CampoUsuario } from './campo-usuario';
import { CodigoRecuperacao } from './codigo-recuperacao';

/** Senha nova com usuário + celular + código de recuperação (sem e-mail). */
export function FormRecuperarSenha() {
  const [erro, setErro] = useState<string | null>(null);
  const [novoCodigo, setNovoCodigo] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [pendente, iniciar] = useTransition();

  function enviar(formData: FormData) {
    const campo = (c: string) => String(formData.get(c) ?? '');
    if (campo('senha') !== campo('confirmacao')) {
      setErro('As senhas não conferem.');
      return;
    }
    setErro(null);
    iniciar(async () => {
      const r = await recuperarSenha({
        usuario: campo('usuario'),
        telefone: campo('telefone'),
        codigo: campo('codigo'),
        senha: campo('senha'),
      });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setNovoCodigo(r.dados.codigo);
    });
  }

  if (concluido) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="size-12 text-sucesso" aria-hidden />
        <div>
          <h1 className="font-display text-3xl">Senha alterada!</h1>
          <p className="mt-1 text-sm text-suave">Agora é só entrar com a senha nova.</p>
        </div>
        <Link href="/entrar" className={`${classeBotaoPrimario} self-stretch`}>
          Entrar
        </Link>
      </div>
    );
  }

  if (novoCodigo) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-lg bg-sucesso-suave p-3 text-sm text-sucesso">
          Senha alterada. O código que você usou deixou de valer — guarde o novo:
        </p>
        <CodigoRecuperacao
          codigo={novoCodigo}
          rotuloContinuar="Ir para o login"
          aoContinuar={() => setConcluido(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl">Recuperar senha</h1>
        <p className="mt-1 text-sm text-suave">
          Use o código de recuperação que você guardou ao criar a conta.
        </p>
      </div>

      <form action={enviar} className="flex flex-col gap-4">
        <CampoUsuario />
        <Campo rotulo="Celular cadastrado">
          <input
            name="telefone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            className={classeInput}
          />
        </Campo>
        <Campo rotulo="Código de recuperação">
          <input
            name="codigo"
            required
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            placeholder="XXXX-XXXX"
            className={`${classeInput} font-mono uppercase tracking-widest`}
          />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Nova senha" ajuda="Mínimo de 6 caracteres.">
            <input
              name="senha"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={classeInput}
            />
          </Campo>
          <Campo rotulo="Repita a senha">
            <input
              name="confirmacao"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={classeInput}
            />
          </Campo>
        </div>

        {erro && (
          <p role="alert" className="rounded-lg bg-perigo-suave p-3 text-sm text-perigo">
            {erro}
          </p>
        )}

        <button type="submit" disabled={pendente} className={classeBotaoPrimario}>
          {pendente ? 'Aguarde…' : 'Criar senha nova'}
        </button>
      </form>

      <div className="flex flex-col gap-1 border-t border-borda pt-4 text-sm text-suave">
        <p>
          Trabalha num salão? Peça ao responsável uma senha nova — ele faz isso em Equipe e
          acessos.
        </p>
        <Link href="/entrar" className="font-medium text-primaria">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
