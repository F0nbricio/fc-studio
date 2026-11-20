import React from 'react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">
            FC
          </span>
          <div>
            <span className="block text-base font-bold tracking-tight text-slate-900">
              FC Studio
            </span>
            <span className="block text-[11px] font-medium text-slate-500">
              Engenharia Web & IA
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <a href="#diferenciais" className="transition hover:text-slate-950">
            Diferenciais
          </a>
          <a href="#como-funciona" className="transition hover:text-slate-950">
            Processo & Garantia
          </a>
          <a href="#briefing" className="transition hover:text-slate-950">
            Solicitar Projeto
          </a>
        </nav>

        <a
          href="#briefing"
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Iniciar Briefing
        </a>
      </div>
    </header>
  );
}
