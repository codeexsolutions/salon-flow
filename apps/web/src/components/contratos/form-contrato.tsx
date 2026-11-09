'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  centavosParaTexto,
  FUNCOES_PARCEIRO,
  HOMOLOGACOES,
  PERIODICIDADES_REPASSE,
  ROTULO_FUNCAO_PARCEIRO,
  ROTULO_HOMOLOGACAO,
  ROTULO_PERIODICIDADE,
  textoParaBps,
  type FuncaoParceiro,
  type Homologacao,
  type PeriodicidadeRepasse,
  type SugestaoContrato,
  type Testemunha,
} from '@salonflow/shared';
import { salvarContrato } from '@/app/admin/(painel)/contratos/actions';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';

/**
 * Cadastro do contrato de parceria. No rascunho tudo pode mudar; no contrato
 * ativo, só a formalização (assinatura, homologação e testemunhas).
 */
export function FormContrato({
  id,
  inicial,
  servicos,
  somenteFormalizacao = false,
}: {
  id: string | null;
  inicial: SugestaoContrato;
  servicos: { id: string; nome: string }[];
  somenteFormalizacao?: boolean;
}) {
  const router = useRouter();
  const [d, setD] = useState(inicial);
  const [cota, setCota] = useState(centavosParaTexto(inicial.cotaProfissionalBps));
  const [testemunhas, setTestemunhas] = useState<Testemunha[]>([
    inicial.testemunhas[0] ?? { nome: '', cpf: '' },
    inicial.testemunhas[1] ?? { nome: '', cpf: '' },
  ]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [pendente, iniciar] = useTransition();
  const travado = somenteFormalizacao;

  const mudar = <K extends keyof SugestaoContrato>(campo: K, valor: SugestaoContrato[K]) => {
    setSucesso(false);
    setD((x) => ({ ...x, [campo]: valor }));
  };
  const alternar = <T,>(lista: T[], item: T) =>
    lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    const cotaBps = textoParaBps(cota);
    if (cotaBps === null) {
      setErro('Informe a cota do profissional entre 0 e 100%.');
      return;
    }
    setErro(null);
    iniciar(async () => {
      const r = await salvarContrato(id, {
        ...d,
        cotaProfissionalBps: cotaBps,
        testemunhas: testemunhas.filter((t) => t.nome.trim() || t.cpf.trim()),
      });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setSucesso(true);
      if (!id) router.push(`/admin/contratos/${r.dados}`);
    });
  }

  const input = (
    campo: keyof SugestaoContrato,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <input
      value={(d[campo] as string | null) ?? ''}
      onChange={(e) => mudar(campo, e.target.value as never)}
      disabled={travado}
      className={classeInput}
      {...props}
    />
  );

  return (
    <form onSubmit={salvar} className="flex flex-col gap-6 text-sm">
      <Secao titulo="Salão-parceiro" descricao="Fica salvo e é sugerido nos próximos contratos.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Razão social (ou nome)">
            {input('salaoRazaoSocial', { required: true })}
          </Campo>
          <Campo rotulo="CNPJ ou CPF">
            {input('salaoDocumento', { required: true, inputMode: 'numeric' })}
          </Campo>
        </div>
        <Campo rotulo="Endereço do salão">{input('salaoEndereco', { required: true })}</Campo>
      </Secao>

      <Secao titulo="Profissional-parceiro">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Nome completo">{input('profissionalNome', { required: true })}</Campo>
          <Campo rotulo="CPF ou CNPJ">
            {input('profissionalDocumento', { required: true, inputMode: 'numeric' })}
          </Campo>
        </div>
        <Campo rotulo="Endereço do profissional">
          {input('profissionalEndereco', { required: true })}
        </Campo>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={d.profissionalMei}
            disabled={travado}
            onChange={(e) => mudar('profissionalMei', e.target.checked)}
          />
          É Microempreendedor Individual (MEI)
        </label>
      </Secao>

      <Secao titulo="Parceria">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium">Funções</legend>
          <div className="flex flex-wrap gap-2">
            {FUNCOES_PARCEIRO.map((f) => (
              <label
                key={f}
                className="flex items-center gap-2 rounded-lg border border-borda px-3 py-1.5 has-[:checked]:border-primaria/50 has-[:checked]:bg-nude"
              >
                <input
                  type="checkbox"
                  checked={d.funcoes.includes(f)}
                  disabled={travado}
                  onChange={() => mudar('funcoes', alternar<FuncaoParceiro>(d.funcoes, f))}
                />
                {ROTULO_FUNCAO_PARCEIRO[f]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium">
            Serviços contratados
            <span className="block text-xs font-normal text-suave">
              Na comanda, um serviço fora desta lista gera um aviso: função diferente da contratada
              pode caracterizar vínculo de emprego.
            </span>
          </legend>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {servicos.map((s) => (
              <label key={s.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={d.servicoIds.includes(s.id)}
                  disabled={travado}
                  onChange={() => mudar('servicoIds', alternar(d.servicoIds, s.id))}
                />
                {s.nome}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Cota do profissional (%)" ajuda="O restante é a cota do salão.">
            <input
              value={cota}
              onChange={(e) => setCota(e.target.value)}
              disabled={travado}
              inputMode="decimal"
              className={classeInput}
            />
          </Campo>
          <Campo rotulo="Pagamento ao profissional">
            <select
              value={d.periodicidade}
              disabled={travado}
              onChange={(e) => mudar('periodicidade', e.target.value as PeriodicidadeRepasse)}
              className={classeInput}
            >
              {PERIODICIDADES_REPASSE.map((p) => (
                <option key={p} value={p}>
                  {ROTULO_PERIODICIDADE[p]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Início da parceria">
            {input('inicioEm', { type: 'date', required: true })}
          </Campo>
        </div>
      </Secao>

      <Secao
        titulo="Formalização"
        descricao="Preencha depois de imprimir, assinar e homologar o contrato. Com tudo preenchido, o contrato pode ser ativado."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Data da assinatura">
            <input
              type="date"
              value={d.assinadoEm ?? ''}
              onChange={(e) => mudar('assinadoEm', e.target.value || null)}
              className={classeInput}
            />
          </Campo>
          <Campo rotulo="Homologado por">
            <select
              value={d.homologacao ?? ''}
              onChange={(e) => mudar('homologacao', (e.target.value || null) as Homologacao | null)}
              className={classeInput}
            >
              <option value="">Ainda não homologado</option>
              {HOMOLOGACOES.map((h) => (
                <option key={h} value={h}>
                  {ROTULO_HOMOLOGACAO[h]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Data da homologação">
            <input
              type="date"
              value={d.homologadoEm ?? ''}
              onChange={(e) => mudar('homologadoEm', e.target.value || null)}
              className={classeInput}
            />
          </Campo>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {testemunhas.map((t, i) => (
            <fieldset key={i} className="flex flex-col gap-2 rounded-xl border border-borda p-3">
              <legend className="px-1 text-xs text-suave">Testemunha {i + 1}</legend>
              <input
                value={t.nome}
                placeholder="Nome completo"
                onChange={(e) =>
                  setTestemunhas((l) =>
                    l.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)),
                  )
                }
                className={classeInput}
              />
              <input
                value={t.cpf}
                placeholder="CPF"
                inputMode="numeric"
                onChange={(e) =>
                  setTestemunhas((l) =>
                    l.map((x, j) => (j === i ? { ...x, cpf: e.target.value } : x)),
                  )
                }
                className={classeInput}
              />
            </fieldset>
          ))}
        </div>
      </Secao>

      {erro && <MensagemForm mensagem={erro} />}
      {sucesso && <MensagemForm sucesso mensagem="Contrato salvo." />}
      <button type="submit" disabled={pendente} className={`${classeBotaoPrimario} self-start`}>
        {pendente ? 'Salvando…' : id ? 'Salvar contrato' : 'Criar contrato (rascunho)'}
      </button>
    </form>
  );
}
