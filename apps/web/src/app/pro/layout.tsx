import type { Metadata } from 'next';
import { AbasPro } from '@/components/pro/abas-pro';
import { Marca } from '@/components/ui/marca';

/** App do PROFISSIONAL comissionado — pensado para celular. */
export const metadata: Metadata = {
  title: { default: 'Minha agenda', template: '%s · SalonFlow Pro' },
  manifest: '/manifests/pro.webmanifest',
};

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-borda bg-superficie/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Marca href="/pro" />
          <span className="rounded-full bg-nude px-2.5 py-0.5 text-xs font-medium text-primaria">
            Pro
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-5 pb-24 print:max-w-none print:p-0">
        {children}
      </main>
      <AbasPro />
    </div>
  );
}
