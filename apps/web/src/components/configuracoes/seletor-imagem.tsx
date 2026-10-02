'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { enviarImagemSalao } from '@/lib/supabase/imagens';
import { classeBotaoSecundario } from '@/components/ui/campo';

/** Envia logo/capa ao Storage e devolve a URL para o formulário salvar. */
export function SeletorImagem({
  salaoId,
  tipo,
  url,
  aoMudar,
}: {
  salaoId: string;
  tipo: 'logo' | 'capa';
  url: string | null;
  aoMudar: (url: string | null) => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    const r = await enviarImagemSalao(salaoId, arquivo, tipo);
    setEnviando(false);
    if ('erro' in r) setErro(r.erro);
    else aoMudar(r.url);
    if (entrada.current) entrada.current.value = '';
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`flex items-center justify-center overflow-hidden border border-dashed border-borda bg-nude text-suave ${
          tipo === 'logo' ? 'size-28 rounded-full' : 'aspect-[3/1] w-full rounded-2xl'
        }`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={tipo === 'logo' ? 'Logo do salão' : 'Capa do salão'}
            className="size-full object-cover"
          />
        ) : (
          <ImagePlus className="size-7" aria-hidden />
        )}
      </div>
      <input
        ref={entrada}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => escolher(e.target.files?.[0])}
        className="sr-only"
        id={`imagem-${tipo}`}
      />
      <div className="flex flex-wrap gap-2">
        <label htmlFor={`imagem-${tipo}`} className={`${classeBotaoSecundario} cursor-pointer`}>
          <ImagePlus className="size-4" aria-hidden />
          {enviando
            ? 'Enviando…'
            : url
              ? 'Trocar'
              : tipo === 'logo'
                ? 'Enviar logo'
                : 'Enviar capa'}
        </label>
        {url && (
          <button type="button" onClick={() => aoMudar(null)} className={classeBotaoSecundario}>
            <Trash2 className="size-4" aria-hidden /> Remover
          </button>
        )}
      </div>
      {erro && <p className="text-xs text-perigo">{erro}</p>}
      <p className="text-xs text-suave">
        {tipo === 'logo' ? 'Quadrada, até 2 MB.' : 'Horizontal (ex.: 1500×500), até 2 MB.'}
      </p>
    </div>
  );
}
