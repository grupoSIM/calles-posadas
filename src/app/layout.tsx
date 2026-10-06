import type { Metadata, Viewport } from 'next';
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
    <html lang="es">
      <body className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 antialiased flex flex-col">
        <header className="flex-shrink-0 bg-posadas-midnight text-white shadow-md z-30 sticky top-0 px-4 py-2.5 border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center space-x-2.5 text-white group transition-colors">
              <div className="w-8 h-8 rounded-lg bg-posadas-river/20 border border-posadas-river/40 flex items-center justify-center text-posadas-river text-base shadow-sm group-hover:bg-posadas-river/30 transition-colors">
                📍
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold tracking-tight text-white group-hover:text-sky-300 transition-colors">
                    Calles de Posadas
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                    SIG Cívico
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block font-normal">
                  Memoria urbana, trazado y ordenanzas municipales
                </p>
              </div>
            </a>
            <nav className="flex items-center space-x-3 text-sm font-medium text-slate-300">
              <a
                href="/"
                className="px-3 py-1.5 rounded-md hover:text-white hover:bg-slate-800/70 transition-colors text-xs sm:text-sm"
              >
                Explorador
              </a>
              <a
                href="/stats"
                className="px-3 py-1.5 rounded-md hover:text-white hover:bg-slate-800/70 transition-colors text-xs sm:text-sm"
              >
                Métricas
              </a>
              <a
                href="https://digesto.hcdposadas.gob.ar/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs bg-slate-800/90 hover:bg-posadas-river hover:text-white text-slate-200 px-3 py-1.5 rounded-md transition-all border border-slate-700/80 hover:border-posadas-river shadow-sm"
              >
                <span>Digesto</span>
                <span className="text-[10px] opacity-75">↗</span>
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
