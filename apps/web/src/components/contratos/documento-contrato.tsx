import {
  documentoDoContrato,
  formatarDocumento,
  ROTULO_HOMOLOGACAO,
  type ContratoDetalhe,
} from '@salonflow/shared';

const dataCurta = (d: string | null) => (d ? d.split('-').reverse().join('/') : '____/____/______');

/**
 * Formatação ABNT (NBR 14724): A4, margens 3 cm (superior/esquerda) e 2 cm
 * (inferior/direita), Arial 12, espaçamento 1,5, texto justificado, recuo de
 * 1,25 cm na primeira linha e títulos em negrito no tamanho do texto.
 */
const ESTILO_IMPRESSAO = `@page { size: A4; margin: 3cm 2cm 2cm 3cm; }`;
const paragrafo = 'text-justify indent-[1.25cm]';

function Assinatura({ nome, detalhe }: { nome: string; detalhe?: string }) {
  return (
    <div className="flex break-inside-avoid flex-col items-center pt-[1.5cm] text-center leading-normal">
      <span className="mb-1 w-full border-t border-black" />
      <span>{nome}</span>
      {detalhe && <span className="text-[10pt]">{detalhe}</span>}
    </div>
  );
}

/** Minuta do contrato de parceria pronta para imprimir ou salvar em PDF. */
export function DocumentoContrato({ contrato }: { contrato: ContratoDetalhe }) {
  const doc = documentoDoContrato(contrato);
  const [t1, t2] = contrato.testemunhas;

  return (
    <article
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      className="mx-auto flex w-full max-w-[21cm] flex-col gap-[0.5cm] border border-borda bg-white px-6 py-8 text-[12pt] leading-[1.5] text-black shadow-sm sm:pt-[3cm] sm:pr-[2cm] sm:pb-[2cm] sm:pl-[3cm] print:max-w-none print:border-0 print:p-0 print:shadow-none"
    >
      <style>{ESTILO_IMPRESSAO}</style>

      <header className="mb-[0.5cm] flex flex-col items-center text-center">
        <h1 className="[font-family:inherit] text-[12pt] leading-[1.5] font-bold uppercase">
          {doc.titulo}
        </h1>
        <p>{doc.subtitulo}</p>
      </header>

      {doc.partes.map((p, i) => (
        <p key={i} className={paragrafo}>
          {p}
        </p>
      ))}

      {doc.clausulas.map((c, i) => (
        <section key={c.titulo} className="flex flex-col gap-[0.25cm]">
          <h2 className="mt-[0.25cm] font-bold uppercase break-after-avoid">
            Cláusula {i + 1}ª — {c.titulo}
          </h2>
          {c.paragrafos.map((p, j) => (
            <p key={j} className={paragrafo}>
              {c.paragrafos.length > 1 && <strong>§ {j + 1}º </strong>}
              {p}
            </p>
          ))}
        </section>
      ))}

      <p className={paragrafo}>
        E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas
        vias de igual teor e forma, na presença das testemunhas abaixo.
      </p>
      <p className="text-right">______________________________, {dataCurta(contrato.assinadoEm)}</p>

      <div className="grid gap-x-[1.5cm] sm:grid-cols-2 print:grid-cols-2">
        <Assinatura
          nome={contrato.salaoRazaoSocial}
          detalhe={`Salão-parceiro · ${formatarDocumento(contrato.salaoDocumento)}`}
        />
        <Assinatura
          nome={contrato.profissionalNome}
          detalhe={`Profissional-parceiro · ${formatarDocumento(contrato.profissionalDocumento)}`}
        />
      </div>

      <p className="mt-[0.5cm] font-bold uppercase">Testemunhas</p>
      <div className="grid gap-x-[1.5cm] sm:grid-cols-2 print:grid-cols-2">
        <Assinatura
          nome={t1?.nome ?? '1. Nome:'}
          detalhe={t1 ? `CPF ${formatarDocumento(t1.cpf)}` : 'CPF:'}
        />
        <Assinatura
          nome={t2?.nome ?? '2. Nome:'}
          detalhe={t2 ? `CPF ${formatarDocumento(t2.cpf)}` : 'CPF:'}
        />
      </div>

      <section className="mt-[1cm] flex break-inside-avoid flex-col border border-black p-[0.5cm]">
        <h2 className="font-bold uppercase">Homologação</h2>
        <p className="text-justify">
          {contrato.homologacao
            ? `${ROTULO_HOMOLOGACAO[contrato.homologacao]} — em ${dataCurta(contrato.homologadoEm)}`
            : 'Sindicato da categoria profissional e laboral (ou, na sua ausência, órgão local do Ministério do Trabalho).'}
        </p>
        <div className="h-[2cm]" />
        <p className="text-[10pt]">Carimbo e assinatura</p>
      </section>
    </article>
  );
}
