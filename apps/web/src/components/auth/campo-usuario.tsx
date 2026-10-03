import { Campo, classeInput } from '@/components/ui/campo';

/** Campo "Usuário" do login e dos cadastros (sem e-mail no SalonFlow). */
export function CampoUsuario({
  novo = false,
  rotulo = 'Usuário',
  erro,
}: {
  /** Criando a conta: mostra as regras do nome de usuário. */
  novo?: boolean;
  rotulo?: string;
  erro?: string[];
}) {
  return (
    <Campo
      rotulo={rotulo}
      erro={erro}
      ajuda={novo ? 'Letras, números, ponto ou _ (ex.: maria.silva). Sem espaços.' : undefined}
    >
      <input
        name="usuario"
        required
        minLength={3}
        maxLength={30}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="username"
        placeholder={novo ? 'maria.silva' : undefined}
        className={classeInput}
      />
    </Campo>
  );
}
