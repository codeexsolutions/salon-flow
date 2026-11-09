import {
  documentoDoContrato,
  formatarDocumento,
  ROTULO_HOMOLOGACAO,
  type ContratoDetalhe,
} from '@salonflow/shared';

const dataCurta = (d: string | null) => (d ? d.split('-').reverse().join('/') : '____/____/______');

function Assinatura({ nome, detalhe }: { nome: string; detalhe?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 pt-10 text-center text-sm">
      <span className="w-full border-t border-current" />
      <span className="font-medium">{nome}</span>
      {detalhe && <span className="text-xs">{detalhe}</span>}
    </div>
  );
}

/** Minuta do contrato de parceria pronta para imprimir ou salvar em PDF. */
export function DocumentoContrato({ contrato }: { contrato: ContratoDetalhe }) {
  const doc = documentoDoContrato(contrato);
  const [t1, t2] = contrato.testemunhas;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-5 rounded-2xl border border-borda bg-white p-8 font-serif text-[15px] leading-relaxed text-neutral-900 print:max-w-none print:rounded-none print:border-0 print:p-0">
      <header className="text-center">
        <h1 className="font-serif text-xl font-bold uppercase">{doc.titulo}</h1>
        <p className="text-sm">{doc.subtitulo}</p>
      </header>

      {doc.partes.map((p, i) => (
        <p key={i} className="text-justify">
          {p}
        </p>
      ))}

      {doc.clausulas.map((c, i) => (
        <section key={c.titulo} className="flex flex-col gap-2 break-inside-avoid-page">
          <h2 className="font-serif font-bold uppercase">
            Cláusula {i + 1}ª — {c.titulo}
          </h2>
          {c.paragrafos.map((p, j) => (
            <p key={j} className="text-justify">
              {c.paragrafos.length > 1 && <strong>§ {j + 1}º </strong>}
              {p}
            </p>
          ))}
        </section>
      ))}

      <p className="text-justify">
        E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas
        vias de igual teor, na presença das testemunhas abaixo.
      </p>
      <p>Local e data: ______________________________, {dataCurta(contrato.assinadoEm)}</p>

      <div className="grid gap-x-10 sm:grid-cols-2 print:grid-cols-2">
        <Assinatura
          nome={contrato.salaoRazaoSocial}
          detalhe={`Salão-parceiro · ${formatarDocumento(contrato.salaoDocumento)}`}
        />
        <Assinatura
          nome={contrato.profissionalNome}
          detalhe={`Profissional-parceiro · ${formatarDocumento(contrato.profissionalDocumento)}`}
        />
        <Assinatura
          nome={t1?.nome ?? 'Testemunha 1'}
          detalhe={t1 ? `CPF ${formatarDocumento(t1.cpf)}` : 'Nome e CPF'}
        />
        <Assinatura
          nome={t2?.nome ?? 'Testemunha 2'}
          detalhe={t2 ? `CPF ${formatarDocumento(t2.cpf)}` : 'Nome e CPF'}
        />
      </div>

      <section className="mt-6 rounded-lg border border-neutral-400 p-4 text-sm break-inside-avoid-page">
        <h2 className="font-bold uppercase">Homologação</h2>
        <p>
          {contrato.homologacao
            ? `${ROTULO_HOMOLOGACAO[contrato.homologacao]} — em ${dataCurta(contrato.homologadoEm)}`
            : 'Sindicato da categoria profissional e laboral (ou, na sua ausência, órgão local do Ministério do Trabalho).'}
        </p>
        <div className="h-16" />
        <p className="text-xs">Carimbo e assinatura</p>
      </section>
    </article>
  );
}
