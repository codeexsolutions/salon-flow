import {
  AVISO_PREVIO_DIAS,
  formatarDocumento,
  ROTULO_FUNCAO_PARCEIRO,
  ROTULO_HOMOLOGACAO,
  ROTULO_PERIODICIDADE,
  type ContratoDetalhe,
} from './schemas/contrato.schema.js';

export interface ClausulaContrato {
  titulo: string;
  paragrafos: string[];
}

export interface DocumentoContrato {
  titulo: string;
  subtitulo: string;
  partes: string[];
  clausulas: ClausulaContrato[];
}

const dataExtenso = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

const pct = (bps: number) =>
  `${(bps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

const lista = (itens: string[]) =>
  itens.length <= 1
    ? (itens[0] ?? '')
    : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;

/**
 * Minuta do contrato de parceria com as cláusulas obrigatórias do § 10 do
 * art. 1º-A da Lei 12.592/2012 (incluído pela Lei 13.352/2016).
 */
export function documentoDoContrato(c: ContratoDetalhe): DocumentoContrato {
  const funcoes = lista(c.funcoes.map((f) => ROTULO_FUNCAO_PARCEIRO[f]));
  const servicos = lista(c.servicos.map((s) => s.nome));
  const cotaSalao = 10_000 - c.cotaProfissionalBps;

  return {
    titulo: 'Contrato de parceria entre salão-parceiro e profissional-parceiro',
    subtitulo: 'Lei nº 12.592/2012, com as alterações da Lei nº 13.352/2016',
    partes: [
      `SALÃO-PARCEIRO: ${c.salaoRazaoSocial}, inscrito no ${c.salaoDocumento.length === 14 ? 'CNPJ' : 'CPF'} sob o nº ${formatarDocumento(c.salaoDocumento)}, estabelecido em ${c.salaoEndereco}.`,
      `PROFISSIONAL-PARCEIRO: ${c.profissionalNome}, inscrito(a) no ${c.profissionalDocumento.length === 14 ? 'CNPJ' : 'CPF'} sob o nº ${formatarDocumento(c.profissionalDocumento)}${c.profissionalMei ? ', na condição de Microempreendedor Individual (MEI)' : ''}, com endereço em ${c.profissionalEndereco}.`,
      'As partes acima identificadas celebram o presente contrato de parceria, que se regerá pelas cláusulas a seguir.',
    ],
    clausulas: [
      {
        titulo: 'Do objeto',
        paragrafos: [
          `O presente contrato tem por objeto a parceria para o exercício, pelo PROFISSIONAL-PARCEIRO, das atividades de ${funcoes}, nas dependências do SALÃO-PARCEIRO${servicos ? `, compreendendo os seguintes serviços: ${servicos}` : ''}.`,
          'O PROFISSIONAL-PARCEIRO não desempenhará funções diferentes das descritas neste contrato.',
        ],
      },
      {
        titulo: 'Da centralização dos pagamentos e das cotas-parte',
        paragrafos: [
          'O SALÃO-PARCEIRO é responsável pela centralização dos pagamentos e recebimentos decorrentes das atividades de prestação de serviços realizadas pelo PROFISSIONAL-PARCEIRO.',
          `Do valor recebido por cada serviço prestado, caberá ao PROFISSIONAL-PARCEIRO a cota-parte de ${pct(c.cotaProfissionalBps)}, a título de remuneração por sua atividade, e ao SALÃO-PARCEIRO a cota-parte de ${pct(cotaSalao)}, retida a título de atividade de aluguel de bens móveis e de utensílios para o desempenho das atividades de serviços de beleza e/ou a título de serviços de gestão, de apoio administrativo, de escritório, de cobrança e de recebimentos de valores transitórios recebidos de clientes das atividades de serviços de beleza.`,
          'Percentuais diferentes para serviços específicos, quando houver, serão ajustados por escrito entre as partes e informados ao PROFISSIONAL-PARCEIRO no demonstrativo de cada repasse.',
        ],
      },
      {
        titulo: 'Dos tributos',
        paragrafos: [
          'O SALÃO-PARCEIRO realizará a retenção e o recolhimento dos tributos e das contribuições sociais e previdenciárias devidos pelo PROFISSIONAL-PARCEIRO em decorrência da atividade objeto deste contrato, incidentes sobre a cota-parte que a este couber, na forma da legislação aplicável.',
        ],
      },
      {
        titulo: 'Das condições e da periodicidade do pagamento',
        paragrafos: [
          `A cota-parte do PROFISSIONAL-PARCEIRO será paga com periodicidade ${ROTULO_PERIODICIDADE[c.periodicidade].toLowerCase()}, para todos os tipos de serviço, acompanhada de demonstrativo dos serviços prestados, dos valores recebidos e das retenções realizadas.`,
        ],
      },
      {
        titulo: 'Do uso dos bens e do acesso ao estabelecimento',
        paragrafos: [
          'O PROFISSIONAL-PARCEIRO poderá utilizar os bens materiais necessários ao desempenho de suas atividades profissionais, tais como mobiliário, equipamentos e utensílios disponibilizados pelo SALÃO-PARCEIRO, e terá acesso e livre circulação nas dependências do estabelecimento destinadas ao atendimento, durante o horário de funcionamento.',
          'O PROFISSIONAL-PARCEIRO organizará a sua disponibilidade de atendimento, que será registrada na agenda do estabelecimento para o agendamento dos clientes.',
        ],
      },
      {
        titulo: 'Da rescisão',
        paragrafos: [
          `Qualquer das partes poderá rescindir unilateralmente este contrato, no caso de não subsistir interesse na sua continuidade, mediante aviso prévio de, no mínimo, ${AVISO_PREVIO_DIAS} (trinta) dias.`,
        ],
      },
      {
        titulo: 'Das responsabilidades',
        paragrafos: [
          'As partes são responsáveis, cada qual em sua esfera, pela manutenção e higiene de materiais e equipamentos, pelas condições de funcionamento do negócio e pelo bom atendimento dos clientes.',
          'Cabe ao SALÃO-PARCEIRO a preservação e a manutenção das adequadas condições de trabalho do PROFISSIONAL-PARCEIRO, especialmente quanto aos seus equipamentos e instalações, possibilitando as condições adequadas ao cumprimento das normas de segurança e saúde.',
        ],
      },
      {
        titulo: 'Da regularidade fiscal do profissional',
        paragrafos: [
          'O PROFISSIONAL-PARCEIRO obriga-se a manter a regularidade de sua inscrição perante as autoridades fazendárias.',
        ],
      },
      {
        titulo: 'Da natureza da parceria',
        paragrafos: [
          'Enquanto perdurar a relação de parceria, o PROFISSIONAL-PARCEIRO não terá relação de emprego ou de sociedade com o SALÃO-PARCEIRO.',
          'A cota-parte destinada ao PROFISSIONAL-PARCEIRO não será considerada para o cômputo da receita bruta do SALÃO-PARCEIRO.',
          'O PROFISSIONAL-PARCEIRO, mesmo que inscrito como pessoa jurídica, será assistido pelo sindicato de sua categoria profissional.',
        ],
      },
      {
        titulo: 'Da vigência e da homologação',
        paragrafos: [
          `Este contrato vigora a partir de ${dataExtenso(c.inicioEm)}, por prazo indeterminado.`,
          `Este contrato será homologado ${c.homologacao ? `perante o ${ROTULO_HOMOLOGACAO[c.homologacao].toLowerCase()}` : 'pelo sindicato da categoria profissional e laboral e, na ausência deste, pelo órgão local competente do Ministério do Trabalho'}, perante duas testemunhas.`,
        ],
      },
    ],
  };
}
