'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="flex-shrink-0 bg-posadas-midnight text-white shadow-md z-30 sticky top-0 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-800/80 w-full max-w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-0">
        <Link href="/" className="flex items-center space-x-2 text-white group transition-colors min-w-0 flex-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-posadas-river/20 border border-posadas-river/40 flex items-center justify-center text-posadas-river text-sm sm:text-base shadow-sm group-hover:bg-posadas-river/30 transition-colors flex-shrink-0">
            📍
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white group-hover:text-sky-300 transition-colors truncate">
                Calles de Posadas
              </span>
              <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider flex-shrink-0 hidden xs:inline-block">
                SIG Cívico
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-normal truncate">
              Memoria urbana, trazado y ordenanzas municipales
            </p>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center space-x-3 text-sm font-medium text-slate-300 flex-shrink-0">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-md hover:text-white hover:bg-slate-800/70 transition-colors text-xs sm:text-sm"
          >
            Explorador
          </Link>
          <Link
            href="/stats"
            className="px-3 py-1.5 rounded-md hover:text-white hover:bg-slate-800/70 transition-colors text-xs sm:text-sm"
          >
            Métricas
          </Link>
          <a
            href="https://ide.posadas.gob.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs bg-slate-800/90 hover:bg-posadas-river hover:text-white text-slate-200 px-3 py-1.5 rounded-md transition-all border border-slate-700/80 hover:border-posadas-river shadow-sm"
          >
            <span>IDE Posadas</span>
            <span className="text-[10px] opacity-75">↗</span>
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

        {/* Controles de Navegación Mobile */}
        <div className="flex md:hidden items-center space-x-1 flex-shrink-0">
          <Link
            href="/stats"
            className="p-1.5 px-2 rounded-md text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 flex items-center gap-1"
            title="Ver estadísticas y métricas"
          >
            <span>📊</span>
            <span className="hidden sm:inline">Métricas</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 px-2 rounded-md text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 focus:outline-none text-xs flex items-center gap-1 font-semibold"
            aria-label="Abrir menú de navegación"
            title="Menú"
          >
            <span>{mobileMenuOpen ? '✕' : '☰'}</span>
            <span className="hidden sm:inline">Menú</span>
          </button>
        </div>
      </div>

      {/* Menú desplegable Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 pt-2 border-t border-slate-800/80 flex flex-col space-y-1.5 pb-1 animate-in fade-in duration-150">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-md hover:bg-slate-800/70 text-slate-200 text-xs font-medium flex items-center justify-between"
          >
            <span>🗺️ Explorador de Calles</span>
            <span className="text-[10px] text-slate-400">Mapa</span>
          </Link>
          <Link
            href="/stats"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-md hover:bg-slate-800/70 text-slate-200 text-xs font-medium flex items-center justify-between"
          >
            <span>📊 Métricas de Cobertura</span>
            <span className="text-[10px] text-slate-400">Estadísticas</span>
          </Link>
          <a
            href="https://ide.posadas.gob.ar/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-md hover:bg-slate-800/70 text-slate-200 text-xs font-medium flex items-center justify-between"
          >
            <span>🌐 IDE Posadas (Infraestructura de Datos)</span>
            <span className="text-[10px] text-slate-400">↗</span>
          </a>
          <a
            href="https://digesto.hcdposadas.gob.ar/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-md hover:bg-slate-800/70 text-slate-200 text-xs font-medium flex items-center justify-between"
          >
            <span>📜 Digesto Jurídico Municipal HCD</span>
            <span className="text-[10px] text-slate-400">↗</span>
          </a>
        </div>
      )}
    </header>
  );
}
