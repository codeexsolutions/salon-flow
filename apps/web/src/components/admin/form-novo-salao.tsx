'use client';

import { useActionState, useState } from 'react';
import { criarSalao, type EstadoNovoSalao } from '@/app/admin/novo-salao/actions';

/** Sugestão de endereço a partir do nome (a API normaliza de novo ao salvar). */
function sugerirSlug(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const estadoInicial: EstadoNovoSalao = {};

export function FormNovoSalao() {
  const [estado, acao, enviando] = useActionState(criarSalao, estadoInicial);
  const [slug, setSlug] = useState(estado.valores?.slug ?? '');
  const [slugEditado, setSlugEditado] = useState(false);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo rotulo="Nome do salão" erro={estado.erros?.nome}>
        <input
          name="nome"
          required
          defaultValue={estado.valores?.nome}
          onChange={(e) => !slugEditado && setSlug(sugerirSlug(e.target.value))}
          placeholder="Studio Bela Vista"
          className={classeInput}
        />
      </Campo>

      <Campo
        rotulo="Endereço da página do salão"
        erro={estado.erros?.slug}
        ajuda="É o link que você vai divulgar para os clientes agendarem."
      >
        <div className="flex items-center rounded-lg border border-borda">
          <span className="pl-3 text-sm text-suave">salonflow.com.br/s/</span>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugEditado(true);
              setSlug(e.target.value.toLowerCase());
            }}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none"
          />
        </div>
      </Campo>

      <Campo rotulo="Telefone / WhatsApp" erro={estado.erros?.telefone}>
        <input
          name="telefone"
          type="tel"
          defaultValue={estado.valores?.telefone}
          placeholder="(11) 99999-9999"
          className={classeInput}
        />
      </Campo>

      <div className="grid grid-cols-[1fr_5rem] gap-3">
        <Campo rotulo="Cidade" erro={estado.erros?.cidade}>
          <input name="cidade" defaultValue={estado.valores?.cidade} className={classeInput} />
        </Campo>
        <Campo rotulo="UF" erro={estado.erros?.uf}>
          <input
            name="uf"
            maxLength={2}
            defaultValue={estado.valores?.uf}
            placeholder="SP"
            className={`${classeInput} uppercase`}
          />
        </Campo>
      </div>

      {estado.mensagem && (
        <p role="alert" className="text-sm text-perigo">
          {estado.mensagem}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-primaria px-4 py-3 font-medium text-primaria-contraste disabled:opacity-60"
      >
        {enviando ? 'Cadastrando…' : 'Cadastrar salão'}
      </button>
    </form>
  );
}

const classeInput = 'w-full rounded-lg border border-borda bg-transparent px-3 py-2';

function Campo({
  rotulo,
  erro,
  ajuda,
  children,
}: {
  rotulo: string;
  erro?: string[];
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{rotulo}</span>
      {children}
      {ajuda && !erro && <span className="text-xs text-suave">{ajuda}</span>}
      {erro && <span className="text-xs text-perigo">{erro[0]}</span>}
    </label>
  );
}
