import Link from 'next/link';

/** Logotipo textual do SalonFlow. */
export function Marca({ href = '/', tamanho = 'md' }: { href?: string; tamanho?: 'md' | 'lg' }) {
  return (
    <Link
      href={href}
      className={`font-display font-semibold tracking-tight text-primaria ${
        tamanho === 'lg' ? 'text-3xl' : 'text-xl'
      }`}
    >
      Salon<span className="text-dourado">Flow</span>
    </Link>
  );
}
