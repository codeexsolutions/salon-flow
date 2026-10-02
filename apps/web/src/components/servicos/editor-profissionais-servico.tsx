'use client';

import { useActionState, useState } from 'react';
import {
  centavosParaTexto,
  formatarDuracao,
  formatarPreco,
  textoParaCentavos,
  type ProfissionalDoServico,
  type ProfissionalResumo,
} from '@salonflow/shared';
import { salvarProfissionaisServico } from '@/app/admin/(painel)/servicos/actions';
import type { EstadoForm } from '@/lib/api/estado-form';
import { classeBotaoPrimario, MensagemForm } from '@/components/ui/campo';

interface Linha {
  marcado: boolean;
  /** Texto digitado; vazio = usa o valor do serviço. */
  preco: string;
  duracao: string;
}

/** Marca quem faz o serviço e, opcionalmente, preço/duração próprios de cada um. */
export function EditorProfissionaisServico({
  servicoId,
  precoCentavos,
  duracaoMin,
  profissionais,
  vinculados,
}: {
  servicoId: string;
  precoCentavos: number;
  duracaoMin: number;
  /** Profissionais ativos do salão. */
  profissionais: ProfissionalResumo[];
  /** Quem já faz o serviço. */
  vinculados: ProfissionalDoServico[];
}) {
  const [linhas, setLinhas] = useState<Record<string, Linha>>(() =>
    Object.fromEntries(
      profissionais.map((p) => {
        const v = vinculados.find((x) => x.profissionalId === p.id);
        return [
          p.id,
          {
            marcado: Boolean(v),
            preco: v?.precoCentavos != null ? centavosParaTexto(v.precoCentavos) : '',
            duracao: v?.duracaoMin != null ? String(v.duracaoMin) : '',
          },
        ];
      }),
    ),
  );
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(
    salvarProfissionaisServico.bind(null, servicoId),
    {},
  );

  const alterar = (id: string, mudanca: Partial<Linha>) =>
    setLinhas((l) => ({ ...l, [id]: { ...l[id], ...mudanca } }));

  const payload = profissionais
    .filter((p) => linhas[p.id].marcado)
    .map((p) => ({
      profissionalId: p.id,
      precoCentavos:
        linhas[p.id].preco.trim() === '' ? null : (textoParaCentavos(linhas[p.id].preco) ?? -1),
      duracaoMin: linhas[p.id].duracao.trim() === '' ? null : Number(linhas[p.id].duracao),
    }));

  if (profissionais.length === 0) {
    return (
      <p className="text-sm text-suave">Cadastre profissionais para vinculá-los ao serviço.</p>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="profissionais" value={JSON.stringify(payload)} />
      <p className="text-xs text-suave">
        Deixe preço e duração em branco para usar os do serviço ({formatarPreco(precoCentavos)} ·{' '}
        {formatarDuracao(duracaoMin)}).
      </p>

      <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda bg-superficie">
        {profissionais.map((p) => {
          const linha = linhas[p.id];
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
              <label className="flex min-w-40 flex-1 items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={linha.marcado}
                  onChange={(e) => alterar(p.id, { marcado: e.target.checked })}
                />
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: p.corAgenda }}
                  aria-hidden
                />
                {p.nome}
              </label>
              {linha.marcado && (
                <div className="flex items-center gap-2">
                  <input
                    inputMode="decimal"
                    value={linha.preco}
                    onChange={(e) => alterar(p.id, { preco: e.target.value })}
                    placeholder={centavosParaTexto(precoCentavos)}
                    aria-label={`Preço próprio de ${p.nome}`}
                    className="w-24 rounded-md border border-borda bg-transparent px-2 py-1"
                  />
                  <input
                    type="number"
                    min={5}
                    max={720}
                    step={5}
                    value={linha.duracao}
                    onChange={(e) => alterar(p.id, { duracao: e.target.value })}
                    placeholder={String(duracaoMin)}
                    aria-label={`Duração própria de ${p.nome} (minutos)`}
                    className="w-20 rounded-md border border-borda bg-transparent px-2 py-1"
                  />
                  <span className="text-xs text-suave">min</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <MensagemForm sucesso={estado.sucesso} mensagem={estado.mensagem} />

      <button type="submit" disabled={enviando} className={`${classeBotaoPrimario} self-start`}>
        {enviando ? 'Salvando…' : 'Salvar profissionais'}
      </button>
    </form>
  );
}
