import { MessageCircle } from 'lucide-react';
import { linkWhatsApp } from '@salonflow/shared';
import { classeBotaoSecundario } from '@/components/ui/campo';

/**
 * Botão do WhatsApp com mensagens prontas: abre a conversa já com o texto. Sem
 * telefone válido, não aparece.
 */
export function MenuWhatsApp({
  telefone,
  opcoes,
}: {
  telefone: string | null;
  opcoes: { rotulo: string; texto?: string }[];
}) {
  if (!linkWhatsApp(telefone)) return null;
  return (
    <details className="relative">
      <summary className={`${classeBotaoSecundario} cursor-pointer list-none`}>
        <MessageCircle className="size-4" aria-hidden />
        WhatsApp
      </summary>
      <ul className="absolute right-0 z-20 mt-1 flex w-60 flex-col overflow-hidden rounded-xl border border-borda bg-superficie text-sm shadow-lg">
        {opcoes.map((o) => (
          <li key={o.rotulo}>
            <a
              href={linkWhatsApp(telefone, o.texto)!}
              target="_blank"
              rel="noreferrer"
              className="block px-3 py-2 hover:bg-nude"
            >
              {o.rotulo}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
