'use client';

import { useActionState, useState } from 'react';
import { centavosParaTexto, formatarDuracao, type ServicoResumo } from '@salonflow/shared';
import { atualizarServico, criarServico } from '@/app/admin/(painel)/servicos/actions';
import type { EstadoForm } from '@/lib/api/estado-form';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';

/** Cadastro (sem `servico`) ou edição (com `servico`). */
export function FormServico({
  servico,
  categorias,
}: {
  servico?: ServicoResumo;
  /** Categorias já usadas no salão, sugeridas no campo. */
  categorias: string[];
}) {
  const acaoServidor = servico ? atualizarServico.bind(null, servico.id) : criarServico;
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(acaoServidor, {});
  const [duracao, setDuracao] = useState(servico?.duracaoMin ?? 30);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo rotulo="Nome" erro={estado.erros?.nome}>
        <input
          name="nome"
          required
          defaultValue={servico?.nome}
          placeholder="Corte feminino"
          className={classeInput}
        />
      </Campo>

      <Campo
        rotulo="Categoria"
        erro={estado.erros?.categoria}
        ajuda="Opcional. Agrupa os serviços na lista e no app do cliente."
      >
        <input
          name="categoria"
          list="categorias-servico"
          defaultValue={servico?.categoria ?? ''}
          placeholder="Cabelo, Unhas, Barba…"
          className={classeInput}
        />
        <datalist id="categorias-servico">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Preço" erro={estado.erros?.precoCentavos}>
          <div className="flex items-center rounded-lg border border-borda">
            <span className="pl-3 text-sm text-suave">R$</span>
            <input
              name="preco"
              required
              inputMode="decimal"
              defaultValue={servico ? centavosParaTexto(servico.precoCentavos) : ''}
              placeholder="0,00"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 outline-none"
            />
          </div>
        </Campo>
        <Campo
          rotulo="Duração (minutos)"
          erro={estado.erros?.duracaoMin}
          ajuda={duracao > 0 ? formatarDuracao(duracao) : undefined}
        >
          <input
            name="duracaoMin"
            type="number"
            required
            min={5}
            max={720}
            step={5}
            value={duracao}
            onChange={(e) => setDuracao(Number(e.target.value))}
            className={classeInput}
          />
        </Campo>
      </div>

      <Campo rotulo="Descrição" erro={estado.erros?.descricao}>
        <textarea
          name="descricao"
          rows={2}
          maxLength={500}
          defaultValue={servico?.descricao ?? ''}
          placeholder="Opcional. Aparece para o cliente ao agendar."
          className={classeInput}
        />
      </Campo>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="visivelOnline"
          defaultChecked={servico?.visivelOnline ?? true}
        />
        Cliente pode agendar este serviço pelo app
      </label>

      <MensagemForm sucesso={estado.sucesso} mensagem={estado.mensagem} />

      <button type="submit" disabled={enviando} className={`${classeBotaoPrimario} self-start`}>
        {enviando ? 'Salvando…' : servico ? 'Salvar serviço' : 'Cadastrar serviço'}
      </button>
    </form>
  );
}
