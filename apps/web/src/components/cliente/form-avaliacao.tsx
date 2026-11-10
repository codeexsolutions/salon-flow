'use client';

import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import type { AvaliacaoPublica } from '@salonflow/shared';
import { enviarAvaliacao } from '@/app/(cliente)/avaliar/[token]/actions';
import { classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';

const ROTULOS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];

/** Estrelas de 1 a 5 + comentário. Depois de enviada, mostra a resposta. */
export function FormAvaliacao({ token, inicial }: { token: string; inicial: AvaliacaoPublica }) {
  const [avaliacao, setAvaliacao] = useState(inicial);
  const [nota, setNota] = useState(0);
  const [destaque, setDestaque] = useState(0);
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  if (avaliacao.respondida) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-sucesso/40 bg-sucesso-suave p-6 text-center">
        <p className="text-lg font-semibold">Obrigado pela avaliação!</p>
        <Estrelas valor={avaliacao.nota ?? 0} />
        {avaliacao.comentario && (
          <p className="text-sm whitespace-pre-line">&ldquo;{avaliacao.comentario}&rdquo;</p>
        )}
      </div>
    );
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!nota) {
      setErro('Toque nas estrelas para dar sua nota.');
      return;
    }
    setErro(null);
    iniciar(async () => {
      const r = await enviarAvaliacao(token, { nota, comentario });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setAvaliacao(r.dados);
    });
  }

  const mostrada = destaque || nota;

  return (
    <form
      onSubmit={enviar}
      className="flex flex-col items-center gap-4 rounded-2xl border border-borda bg-superficie p-6"
    >
      <div
        role="radiogroup"
        aria-label="Nota de 1 a 5"
        className="flex gap-1"
        onMouseLeave={() => setDestaque(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={nota === n}
            aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'} — ${ROTULOS[n]}`}
            onClick={() => setNota(n)}
            onMouseEnter={() => setDestaque(n)}
            className="rounded-lg p-1 transition hover:scale-110"
          >
            <Star
              className={`size-10 ${n <= mostrada ? 'fill-amber-400 text-amber-400' : 'text-borda'}`}
              aria-hidden
            />
          </button>
        ))}
      </div>
      <p className="h-5 text-sm font-medium text-suave">{ROTULOS[mostrada]}</p>
      <textarea
        rows={3}
        maxLength={1000}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Quer contar mais? (opcional)"
        aria-label="Comentário"
        className={classeInput}
      />
      {erro && <MensagemForm mensagem={erro} />}
      <button type="submit" disabled={pendente} className={`${classeBotaoPrimario} w-full`}>
        {pendente ? 'Enviando…' : 'Enviar avaliação'}
      </button>
    </form>
  );
}

function Estrelas({ valor }: { valor: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Nota ${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-6 ${n <= valor ? 'fill-amber-400 text-amber-400' : 'text-borda'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}
