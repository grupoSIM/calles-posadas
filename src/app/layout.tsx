import type { Metadata, Viewport } from 'next';
import Header from '@/components/layout/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Calles de Posadas — Catálogo e Historial Urbano',
  description: 'Catálogo cívico interactivo de calles, avenidas, ciclovías, chacras y trazabilidad legal de Posadas, Misiones.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-dvh max-h-dvh w-full overflow-hidden">
      <body className="h-dvh max-h-dvh w-full overflow-hidden bg-slate-50 text-slate-900 antialiased flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden w-full relative">
          {children}
        </main>
      </body>
    </html>
  );
}
