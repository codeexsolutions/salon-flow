import { AreaProtegida } from '@/components/painel/area-protegida';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AreaProtegida permissao="PROFISSIONAIS">{children}</AreaProtegida>;
}
