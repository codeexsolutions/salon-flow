import type { Metadata, Viewport } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';

const corpo = DM_Sans({ variable: '--font-corpo', subsets: ['latin'] });
const titulo = Playfair_Display({ variable: '--font-titulo', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'SalonFlow', template: '%s · SalonFlow' },
  description: 'Agendamento e gestão para salões de beleza e barbearias',
  appleWebApp: { capable: true, statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf7f5' },
    { media: '(prefers-color-scheme: dark)', color: '#1b1415' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${corpo.variable} ${titulo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
