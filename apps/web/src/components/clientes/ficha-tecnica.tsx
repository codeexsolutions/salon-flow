'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { NotebookPen, Pencil, Trash2 } from 'lucide-react';
import type { AnotacaoCliente } from '@salonflow/shared';
import type { Resultado } from '@/lib/api/resultado';
import {
  Campo,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeInput,
  MensagemForm,
} from '@/components/ui/campo';

type Opcao = { id: string; nome: string };

const dataCurta = (d: string) => d.split('-').reverse().join('/');

interface Rascunho {
  data: string;
  texto: string;
  servicoId: string;
  profissionalId: string;
}

/**
 * Ficha técnica do cliente: o que foi feito em cada atendimento. Usada no painel
 * (escolhe o profissional) e no app do profissional (sempre em nome dele).
 */
export function FichaTecnica({
  clienteId,
  anotacoes,
  servicos,
  profissionais,
  padrao,
  salvar,
  excluir,
}: {
  clienteId: string;
  anotacoes: AnotacaoCliente[];
  servicos: Opcao[];
  /** Sem lista = app do profissional (o registro fica no nome de quem escreve). */
  profissionais?: Opcao[];
  /** Valores sugeridos para um registro novo (ex.: o atendimento de hoje). */
  padrao: { data: string; servicoId?: string; profissionalId?: string };
  salvar: (
    clienteId: string,
    anotacaoId: string | null,
    entrada: unknown,
  ) => Promise<Resultado<AnotacaoCliente>>;
  excluir: (clienteId: string, anotacaoId: string) => Promise<Resultado>;
}) {
  const router = useRouter();
  const novo = (): Rascunho => ({
    data: padrao.data,
    texto: '',
    servicoId: padrao.servicoId ?? '',
    profissionalId: padrao.profissionalId ?? '',
  });
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Rascunho>(novo);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const mudar = (campo: keyof Rascunho, valor: string) =>
    setRascunho((r) => ({ ...r, [campo]: valor }));

  function editar(a: AnotacaoCliente) {
    setErro(null);
    setEditando(a.id);
    setRascunho({
      data: a.data,
      texto: a.texto,
      servicoId: a.servico?.id ?? '',
      profissionalId: a.profissional?.id ?? '',
    });
  }

  function cancelar() {
    setEditando(null);
    setErro(null);
    setRascunho(novo());
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await salvar(clienteId, editando, {
        data: rascunho.data,
        texto: rascunho.texto,
        servicoId: rascunho.servicoId || null,
        ...(profissionais && { profissionalId: rascunho.profissionalId || null }),
      });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      cancelar();
      router.refresh();
    });
  }

  function remover(a: AnotacaoCliente) {
    if (!confirm('Excluir este registro da ficha técnica?')) return;
    iniciar(async () => {
      const r = await excluir(clienteId, a.id);
      if (!r.ok) setErro(r.erro);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <form
        onSubmit={enviar}
        className="flex flex-col gap-3 rounded-xl border border-borda bg-nude/40 p-3"
      >
        <p className="font-medium">{editando ? 'Editar registro' : 'Novo registro'}</p>
        <div className={`grid gap-3 ${profissionais ? 'sm:grid-cols-3' : 'grid-cols-2'}`}>
          <Campo rotulo="Data">
            <input
              type="date"
              required
              value={rascunho.data}
              onChange={(e) => mudar('data', e.target.value)}
              className={classeInput}
            />
          </Campo>
          <Campo rotulo="Serviço">
            <select
              value={rascunho.servicoId}
              onChange={(e) => mudar('servicoId', e.target.value)}
              className={classeInput}
            >
              <option value="">—</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </Campo>
          {profissionais && (
            <Campo rotulo="Profissional">
              <select
                value={rascunho.profissionalId}
                onChange={(e) => mudar('profissionalId', e.target.value)}
                className={classeInput}
              >
                <option value="">—</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </Campo>
          )}
        </div>
        <Campo rotulo="O que foi feito">
          <textarea
            required
            rows={3}
            maxLength={2000}
            value={rascunho.texto}
            onChange={(e) => mudar('texto', e.target.value)}
            placeholder="Ex.: Coloração 2.5 castanho escuro + OX 20 vol, pausa de 35 min. Raiz 3 cm."
            className={classeInput}
          />
        </Campo>
        {erro && <MensagemForm mensagem={erro} />}
        <div className="flex gap-2">
          <button type="submit" disabled={pendente} className={classeBotaoPrimario}>
            {pendente ? 'Salvando…' : editando ? 'Salvar alterações' : 'Adicionar à ficha'}
          </button>
          {editando && (
            <button type="button" onClick={cancelar} className={classeBotaoSecundario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {anotacoes.length === 0 ? (
        <p className="flex items-center gap-2 text-suave">
          <NotebookPen className="size-4" aria-hidden />
          Nenhum registro ainda. Anote fórmulas, tons e cuidados para repetir o resultado.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {anotacoes.map((a) => (
            <li key={a.id} className="flex flex-col gap-1 border-l-2 border-primaria/40 pl-3">
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-suave">
                <span className="font-medium text-foreground">{dataCurta(a.data)}</span>
                {a.servico && <span>· {a.servico.nome}</span>}
                {a.profissional && <span>· {a.profissional.nome}</span>}
                {a.podeEditar && (
                  <span className="ml-auto flex gap-1">
                    <button
                      type="button"
                      onClick={() => editar(a)}
                      className="rounded p-1 hover:bg-nude hover:text-primaria"
                      aria-label="Editar registro"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => remover(a)}
                      disabled={pendente}
                      className="rounded p-1 hover:bg-perigo-suave hover:text-perigo"
                      aria-label="Excluir registro"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </span>
                )}
              </div>
              <p className="whitespace-pre-line">{a.texto}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
