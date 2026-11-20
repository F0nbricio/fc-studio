import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FC Studio | Engenharia Web & Soluções Digitais Sob Medida',
  description:
    'Sites profissionais sob demanda, modulados, otimizados e seguros. Arquitetura moderna com verificação rigorosa e suporte direto.',
  icons: {
    icon: [
      { url: '/fc-icon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=2' },
    ],
    shortcut: '/fc-icon.svg?v=2',
    apple: '/fc-icon.svg?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
