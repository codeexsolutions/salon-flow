'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { AVISO_PREVIO_DIAS, TAMANHO_MAXIMO_CONTRATO_BYTES } from '@salonflow/shared';
import {
  ativarContrato,
  encerrarContrato,
  excluirContrato,
} from '@/app/admin/(painel)/contratos/actions';
import {
  classeBotaoPerigo,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeInput,
  MensagemForm,
} from '@/components/ui/campo';

export function AtivarContrato({ id, pendencias }: { id: string; pendencias: string[] }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  return (
    <div className="flex flex-col gap-2 text-sm">
      {pendencias.length > 0 && (
        <ul className="list-disc pl-5 text-alerta">
          {pendencias.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled={pendente || pendencias.length > 0}
        onClick={() => {
          if (!confirm('Ativar o contrato? Depois disso, só a formalização pode ser alterada.')) {
            return;
          }
          setErro(null);
          iniciar(async () => {
            const r = await ativarContrato(id);
            if (!r.ok) setErro(r.erro);
          });
        }}
        className={`${classeBotaoPrimario} self-start`}
      >
        {pendente ? 'Ativando…' : 'Ativar contrato'}
      </button>
      {erro && <MensagemForm mensagem={erro} />}
    </div>
  );
}

/** Envia o PDF do contrato assinado e homologado. */
export function EnviarPdf({ id, temArquivo }: { id: string; temArquivo: boolean }) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(arquivo: File) {
    setErro(null);
    if (arquivo.type !== 'application/pdf') return setErro('Envie o contrato em PDF.');
    if (arquivo.size > TAMANHO_MAXIMO_CONTRATO_BYTES) {
      return setErro('O PDF pode ter no máximo 5 MB.');
    }
    setEnviando(true);
    const corpo = new FormData();
    corpo.append('arquivo', arquivo);
    try {
      const resposta = await fetch(`/admin/contratos/${id}/arquivo`, {
        method: 'POST',
        body: corpo,
      });
      if (!resposta.ok) {
        const dados = (await resposta.json().catch(() => null)) as { mensagem?: string } | null;
        setErro(dados?.mensagem ?? 'Não foi possível enviar o arquivo.');
        return;
      }
      router.refresh();
    } finally {
      setEnviando(false);
      if (entrada.current) entrada.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap gap-2">
        {temArquivo && (
          <a href={`/admin/contratos/${id}/arquivo`} className={classeBotaoSecundario}>
            Baixar PDF assinado
          </a>
        )}
        <button
          type="button"
          disabled={enviando}
          onClick={() => entrada.current?.click()}
          className={classeBotaoSecundario}
        >
          {enviando ? 'Enviando…' : temArquivo ? 'Trocar PDF assinado' : 'Enviar PDF assinado'}
        </button>
      </div>
      <input
        ref={entrada}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => e.target.files?.[0] && enviar(e.target.files[0])}
      />
      {erro && <MensagemForm mensagem={erro} />}
    </div>
  );
}

export function EncerrarContrato({ id, hoje }: { id: string; hoje: string }) {
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState(hoje);
  const [fim, setFim] = useState('');
  const [comumAcordo, setComumAcordo] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`${classeBotaoPerigo} self-start`}
      >
        Encerrar parceria
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-suave">
        Rescisão unilateral exige aviso prévio de no mínimo {AVISO_PREVIO_DIAS} dias. De comum
        acordo, a data final pode ser antes.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          Data do aviso prévio
          <input
            type="date"
            value={aviso}
            onChange={(e) => setAviso(e.target.value)}
            className={classeInput}
          />
        </label>
        <label className="flex flex-col gap-1">
          Último dia da parceria
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className={classeInput}
          />
        </label>
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={comumAcordo}
          onChange={(e) => setComumAcordo(e.target.checked)}
        />
        Encerramento de comum acordo
      </label>
      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo do encerramento"
        maxLength={300}
        className={classeInput}
      />
      {erro && <MensagemForm mensagem={erro} />}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pendente || !fim || motivo.trim().length < 3}
          onClick={() => {
            if (!confirm('Encerrar a parceria? O contrato fica no histórico.')) return;
            setErro(null);
            iniciar(async () => {
              const r = await encerrarContrato(id, {
                avisoPrevioEm: aviso,
                encerradoEm: fim,
                comumAcordo,
                motivo,
              });
              if (r.ok) setAberto(false);
              else setErro(r.erro);
            });
          }}
          className={classeBotaoPerigo}
        >
          {pendente ? 'Encerrando…' : 'Confirmar encerramento'}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="text-suave">
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function ExcluirRascunho({ id }: { id: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pendente}
        onClick={() => {
          if (!confirm('Excluir este rascunho de contrato?')) return;
          iniciar(async () => {
            const r = await excluirContrato(id);
            if (r.ok) router.push('/admin/contratos');
            else setErro(r.erro);
          });
        }}
        className="self-start text-sm text-perigo hover:underline"
      >
        Excluir rascunho
      </button>
      {erro && <span className="text-xs text-perigo">{erro}</span>}
    </span>
  );
}
