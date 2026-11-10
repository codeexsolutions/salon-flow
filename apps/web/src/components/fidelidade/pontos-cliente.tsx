'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Gift } from 'lucide-react';
import { ROTULO_MOVIMENTO_PONTOS, type PontosCliente } from '@salonflow/shared';
import { ajustarPontos, resgatarPremio } from '@/app/admin/(painel)/fidelidade/actions';
import {
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeInput,
  MensagemForm,
} from '@/components/ui/campo';

const dataCurta = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');
const pts = (n: number) => `${n.toLocaleString('pt-BR')} ${Math.abs(n) === 1 ? 'ponto' : 'pontos'}`;

/**
 * Saldo, prêmios para resgatar e extrato de pontos do cliente.
 * `compacto` (comanda): só saldo e resgate.
 */
export function PontosDoCliente({
  clienteId,
  pontos,
  ehDono,
  compacto = false,
}: {
  clienteId: string;
  pontos: PontosCliente;
  ehDono: boolean;
  compacto?: boolean;
}) {
  const router = useRouter();
  const [retorno, setRetorno] = useState<{ ok: boolean; mensagem: string } | null>(null);
  const [verTudo, setVerTudo] = useState(false);
  const [ajuste, setAjuste] = useState({ pontos: '', motivo: '' });
  const [pendente, iniciar] = useTransition();

  if (!pontos.programa) {
    return (
      <p className="text-sm text-suave">
        O programa de pontos ainda não foi configurado.
        {ehDono && (
          <>
            {' '}
            <Link href="/admin/fidelidade" className="text-primaria underline">
              Configurar
            </Link>
          </>
        )}
      </p>
    );
  }

  function resgatar(premio: PontosCliente['premios'][number]) {
    if (!confirm(`Resgatar "${premio.nome}" por ${pts(premio.pontos)}?`)) return;
    setRetorno(null);
    iniciar(async () => {
      const r = await resgatarPremio(clienteId, premio.id);
      setRetorno(
        r.ok
          ? { ok: true, mensagem: `Resgatado: ${premio.nome}.` }
          : { ok: false, mensagem: r.erro },
      );
      if (r.ok) router.refresh();
    });
  }

  function ajustar(evento: React.FormEvent) {
    evento.preventDefault();
    setRetorno(null);
    iniciar(async () => {
      const r = await ajustarPontos(clienteId, {
        pontos: Number(ajuste.pontos.replace(/[^\d-]/g, '')),
        motivo: ajuste.motivo,
      });
      setRetorno(
        r.ok ? { ok: true, mensagem: 'Ajuste lançado.' } : { ok: false, mensagem: r.erro },
      );
      if (r.ok) {
        setAjuste({ pontos: '', motivo: '' });
        router.refresh();
      }
    });
  }

  const extrato = verTudo ? pontos.extrato : pontos.extrato.slice(0, 8);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className={`font-display text-3xl ${pontos.saldo < 0 ? 'text-perigo' : ''}`}>
          {pts(pontos.saldo)}
        </p>
        {pontos.aVencer && (
          <p className="text-xs text-alerta">
            {pts(pontos.aVencer.pontos)} vencem em {dataCurta(pontos.aVencer.em)}
          </p>
        )}
        {!pontos.programa.ativo && (
          <p className="text-xs text-suave">Programa desligado: novas comandas não geram pontos.</p>
        )}
      </div>

      {pontos.premios.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pontos.premios.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-borda px-3 py-2"
            >
              <Gift
                className={`size-4 shrink-0 ${p.podeResgatar ? 'text-primaria' : 'text-suave'}`}
                aria-hidden
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{p.nome}</span>
                <span className="text-xs text-suave">
                  {pts(p.pontos)}
                  {!p.podeResgatar && ` · faltam ${pts(p.pontos - Math.max(pontos.saldo, 0))}`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => resgatar(p)}
                disabled={!p.podeResgatar || pendente}
                className={p.podeResgatar ? classeBotaoPrimario : classeBotaoSecundario}
              >
                Resgatar
              </button>
            </li>
          ))}
        </ul>
      )}

      {retorno && <MensagemForm sucesso={retorno.ok} mensagem={retorno.mensagem} />}

      {!compacto && (
        <>
          {pontos.extrato.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-suave">Extrato</p>
              <ul className="flex flex-col divide-y divide-borda">
                {extrato.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-1.5">
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">
                        {m.comandaId ? (
                          <Link
                            href={`/admin/comandas/${m.comandaId}`}
                            className="hover:text-primaria"
                          >
                            {m.descricao}
                          </Link>
                        ) : (
                          m.descricao
                        )}
                      </span>
                      <span className="text-xs text-suave">
                        {dataCurta(m.data)} · {ROTULO_MOVIMENTO_PONTOS[m.tipo]}
                        {m.expiraEm && ` · vence ${dataCurta(m.expiraEm)}`}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 font-medium ${m.pontos < 0 ? 'text-perigo' : 'text-sucesso'}`}
                    >
                      {m.pontos > 0 ? '+' : ''}
                      {m.pontos.toLocaleString('pt-BR')}
                    </span>
                  </li>
                ))}
              </ul>
              {pontos.extrato.length > 8 && (
                <button
                  type="button"
                  onClick={() => setVerTudo((v) => !v)}
                  className="self-start text-xs text-primaria"
                >
                  {verTudo ? 'Ver menos' : `Ver tudo (${pontos.extrato.length})`}
                </button>
              )}
            </div>
          )}

          {ehDono && (
            <form onSubmit={ajustar} className="flex flex-col gap-2 border-t border-borda pt-3">
              <p className="text-xs font-medium text-suave">Ajuste manual (só o dono)</p>
              <div className="grid grid-cols-[6rem_1fr] gap-2">
                <input
                  required
                  value={ajuste.pontos}
                  placeholder="+50 / -20"
                  aria-label="Pontos"
                  onChange={(e) => setAjuste((a) => ({ ...a, pontos: e.target.value }))}
                  className={classeInput}
                />
                <input
                  required
                  value={ajuste.motivo}
                  placeholder="Motivo"
                  aria-label="Motivo do ajuste"
                  onChange={(e) => setAjuste((a) => ({ ...a, motivo: e.target.value }))}
                  className={classeInput}
                />
              </div>
              <button
                type="submit"
                disabled={pendente}
                className={`${classeBotaoSecundario} self-start`}
              >
                Lançar ajuste
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
