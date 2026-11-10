'use client';

import { useState, useTransition } from 'react';
import {
  centavosParaTexto,
  formatarPreco,
  pontosPorValor,
  textoParaCentavos,
  type ProgramaFidelidade,
} from '@salonflow/shared';
import { salvarPrograma } from '@/app/admin/(painel)/fidelidade/actions';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';

const VALIDADES = [null, 3, 6, 12, 24] as const;
const EXEMPLO_CENTAVOS = 150_00;

/** Regras do programa: quanto vale 1 ponto, validade e o texto para o cliente. */
export function FormPrograma({ programa }: { programa: ProgramaFidelidade | null }) {
  const [ativo, setAtivo] = useState(programa?.ativo ?? true);
  const [valor, setValor] = useState(centavosParaTexto(programa?.centavosPorPonto ?? 100));
  const [validade, setValidade] = useState<number | null>(programa?.validadeMeses ?? 12);
  const [regras, setRegras] = useState(programa?.regras ?? '');
  const [retorno, setRetorno] = useState<{ ok: boolean; mensagem: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  const centavos = textoParaCentavos(valor);
  const exemplo = centavos ? pontosPorValor(EXEMPLO_CENTAVOS, centavos) : null;

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!centavos) {
      setRetorno({ ok: false, mensagem: 'Informe o valor gasto que vale 1 ponto.' });
      return;
    }
    iniciar(async () => {
      const r = await salvarPrograma({
        ativo,
        centavosPorPonto: centavos,
        validadeMeses: validade,
        regras,
      });
      setRetorno(
        r.ok
          ? { ok: true, mensagem: programa ? 'Programa salvo.' : 'Programa criado.' }
          : { ok: false, mensagem: r.erro },
      );
    });
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4 text-sm">
      <label className="flex items-start gap-2 rounded-xl border border-borda p-3">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={ativo}
          onChange={(e) => {
            setRetorno(null);
            setAtivo(e.target.checked);
          }}
        />
        <span>
          <span className="font-medium">Programa ativo</span>
          <span className="block text-xs text-suave">
            Desligado, as comandas param de gerar pontos e o cliente não vê o programa no app. Os
            pontos já ganhos continuam guardados.
          </span>
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          rotulo="A cada (R$) gastos = 1 ponto"
          ajuda={
            exemplo !== null
              ? `Uma comanda de ${formatarPreco(EXEMPLO_CENTAVOS)} gera ${exemplo} ponto(s).`
              : undefined
          }
        >
          <input
            value={valor}
            inputMode="decimal"
            onChange={(e) => {
              setRetorno(null);
              setValor(e.target.value);
            }}
            className={classeInput}
          />
        </Campo>
        <Campo rotulo="Validade dos pontos">
          <select
            value={validade ?? ''}
            onChange={(e) => {
              setRetorno(null);
              setValidade(e.target.value ? Number(e.target.value) : null);
            }}
            className={classeInput}
          >
            {VALIDADES.map((v) => (
              <option key={v ?? 'nunca'} value={v ?? ''}>
                {v ? `${v} meses` : 'Não vencem'}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo
        rotulo="Regras para o cliente (opcional)"
        ajuda="Aparece no app do cliente. Ex.: pontos valem só para serviços; resgate com 1 dia de antecedência."
      >
        <textarea
          rows={3}
          maxLength={1000}
          value={regras}
          onChange={(e) => {
            setRetorno(null);
            setRegras(e.target.value);
          }}
          className={classeInput}
        />
      </Campo>

      <p className="text-xs text-suave">
        Os pontos entram quando a comanda com cliente é fechada (pelo total pago) e saem se ela for
        reaberta. Comandas fechadas antes de criar o programa não geram pontos.
      </p>

      {retorno && <MensagemForm sucesso={retorno.ok} mensagem={retorno.mensagem} />}
      <button type="submit" disabled={pendente} className={`${classeBotaoPrimario} self-start`}>
        {pendente ? 'Salvando…' : programa ? 'Salvar programa' : 'Criar programa'}
      </button>
    </form>
  );
}
