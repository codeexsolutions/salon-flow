import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import { RegistrarPwa } from '@/components/pwa/registrar-pwa';
import './globals.css';

const corpo = DM_Sans({ variable: '--font-corpo', subsets: ['latin'] });
const titulo = Bricolage_Grotesque({ variable: '--font-titulo', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'SalonFlow', template: '%s · SalonFlow' },
  description: 'Agendamento e gestão para salões, barbearias, estética e sobrancelhas',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'SalonFlow' },
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f4' },
    { media: '(prefers-color-scheme: dark)', color: '#121213' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${titulo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <RegistrarPwa />
      </body>
    </html>
  );
}
