import { EmConstrucao } from '@/components/em-construcao';

export const metadata = { title: 'Entrar' };

export default function EntrarPage() {
  return (
    <EmConstrucao
      titulo="Entrar"
      descricao="Login com Google ou link mágico por e-mail (Supabase Auth)."
    />
  );
}
