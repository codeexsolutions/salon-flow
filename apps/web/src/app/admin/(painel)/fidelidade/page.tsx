import type { ConfigFidelidade } from '@salonflow/shared';
import { EditorPremios } from '@/components/fidelidade/editor-premios';
import { FormPrograma } from '@/components/fidelidade/form-programa';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { Secao } from '@/components/ui/secao';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Fidelidade' };

export default async function FidelidadePage() {
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') {
    return <p className="text-sm text-suave">Apenas o dono do salão configura a fidelidade.</p>;
  }
  const { programa, premios } = await apiSalao<ConfigFidelidade>('/fidelidade/config');

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <CabecalhoPagina
        titulo="Fidelidade"
        subtitulo="Programa de pontos: o cliente junta pontos a cada atendimento e troca por prêmios."
      />
      <Secao titulo="Regras do programa">
        <FormPrograma programa={programa} />
      </Secao>
      <Secao
        titulo="Prêmios"
        descricao="O resgate é feito na ficha do cliente ou na comanda, e desconta os pontos."
      >
        <EditorPremios premios={premios} />
      </Secao>
    </div>
  );
}
