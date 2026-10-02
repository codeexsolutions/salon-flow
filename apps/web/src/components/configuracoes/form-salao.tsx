'use client';

import { useState, useTransition } from 'react';
import { z } from 'zod';
import { atualizarSalaoSchema, type SalaoConfiguracao } from '@salonflow/shared';
import { salvarSalao } from '@/app/admin/(painel)/configuracoes/actions';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';
import { SeletorImagem } from './seletor-imagem';

type Erros = Partial<Record<string, string[]>>;

/** Configurações do salão: dados, endereço, imagens e visibilidade no diretório. */
export function FormSalao({ salao }: { salao: SalaoConfiguracao }) {
  const [logoUrl, setLogoUrl] = useState(salao.logoUrl);
  const [capaUrl, setCapaUrl] = useState(salao.capaUrl);
  const [visivel, setVisivel] = useState(salao.visivelNoMarketplace);
  const [erros, setErros] = useState<Erros>({});
  const [retorno, setRetorno] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  function salvar(formData: FormData) {
    const texto = (c: string) => String(formData.get(c) ?? '');
    const dados = {
      nome: texto('nome'),
      slug: texto('slug').toLowerCase(),
      telefone: texto('telefone'),
      cidade: texto('cidade'),
      uf: texto('uf'),
      endereco: texto('endereco'),
      bairro: texto('bairro'),
      descricao: texto('descricao'),
      instagram: texto('instagram'),
      logoUrl,
      capaUrl,
      visivelNoMarketplace: visivel,
    };
    const validacao = atualizarSalaoSchema.safeParse(dados);
    if (!validacao.success) {
      setErros(z.flattenError(validacao.error).fieldErrors);
      setRetorno({ ok: false, texto: 'Confira os campos destacados.' });
      return;
    }
    setErros({});
    setRetorno(null);
    iniciar(async () => {
      const r = await salvarSalao(dados);
      setRetorno(
        r.ok ? { ok: true, texto: 'Configurações salvas.' } : { ok: false, texto: r.erro },
      );
    });
  }

  return (
    <form action={salvar} className="flex flex-col gap-6">
      <Secao titulo="Imagens" descricao="Aparecem na página do salão e na busca de salões.">
        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <SeletorImagem salaoId={salao.id} tipo="logo" url={logoUrl} aoMudar={setLogoUrl} />
          <SeletorImagem salaoId={salao.id} tipo="capa" url={capaUrl} aoMudar={setCapaUrl} />
        </div>
      </Secao>

      <Secao titulo="Dados do salão">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome do salão" erro={erros.nome}>
            <input name="nome" required defaultValue={salao.nome} className={classeInput} />
          </Campo>
          <Campo
            rotulo="Endereço da página"
            erro={erros.slug}
            ajuda="Mudar o endereço invalida links já divulgados."
          >
            <div className="flex items-center rounded-xl border border-borda bg-superficie focus-within:border-primaria">
              <span className="pl-3.5 text-sm text-suave">/s/</span>
              <input
                name="slug"
                required
                defaultValue={salao.slug}
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 outline-none"
              />
            </div>
          </Campo>
          <Campo rotulo="Telefone / WhatsApp" erro={erros.telefone}>
            <input
              name="telefone"
              type="tel"
              defaultValue={salao.telefone ?? ''}
              className={classeInput}
            />
          </Campo>
          <Campo
            rotulo="Instagram"
            erro={erros.instagram}
            ajuda="Só o usuário, ex.: studiobelavista"
          >
            <div className="flex items-center rounded-xl border border-borda bg-superficie focus-within:border-primaria">
              <span className="pl-3.5 text-sm text-suave">@</span>
              <input
                name="instagram"
                defaultValue={salao.instagram ?? ''}
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 outline-none"
              />
            </div>
          </Campo>
          <div className="sm:col-span-2">
            <Campo rotulo="Sobre o salão" erro={erros.descricao} ajuda="Até 600 caracteres.">
              <textarea
                name="descricao"
                rows={3}
                maxLength={600}
                defaultValue={salao.descricao ?? ''}
                placeholder="Conte o que torna o seu salão especial."
                className={classeInput}
              />
            </Campo>
          </div>
        </div>
      </Secao>

      <Secao titulo="Endereço">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Campo rotulo="Rua, número e complemento" erro={erros.endereco}>
            <input name="endereco" defaultValue={salao.endereco ?? ''} className={classeInput} />
          </Campo>
          <Campo rotulo="Bairro" erro={erros.bairro}>
            <input name="bairro" defaultValue={salao.bairro ?? ''} className={classeInput} />
          </Campo>
          <Campo rotulo="Cidade" erro={erros.cidade}>
            <input name="cidade" defaultValue={salao.cidade ?? ''} className={classeInput} />
          </Campo>
          <Campo rotulo="UF" erro={erros.uf}>
            <input
              name="uf"
              maxLength={2}
              defaultValue={salao.uf ?? ''}
              className={`${classeInput} uppercase`}
            />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Diretório de salões">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={visivel}
            onChange={(e) => setVisivel(e.target.checked)}
            className="mt-1"
          />
          <span>
            <strong>Aparecer na busca de salões do SalonFlow</strong>
            <span className="block text-suave">
              Desmarcado, o salão some da busca, mas o link direto da sua página continua
              funcionando.
            </span>
          </span>
        </label>
      </Secao>

      {retorno && <MensagemForm sucesso={retorno.ok} mensagem={retorno.texto} />}
      <button type="submit" disabled={pendente} className={`${classeBotaoPrimario} self-start`}>
        {pendente ? 'Salvando…' : 'Salvar configurações'}
      </button>
    </form>
  );
}
