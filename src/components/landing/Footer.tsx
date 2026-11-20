import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
        <div>
          <p className="text-sm font-bold text-slate-900">FC Studio • Engenharia Web & IA</p>
          <p className="mt-1 text-xs text-slate-500">
            Sites sob demanda • Código modulado, seguro e verificado • Suporte direto pós-entrega
          </p>
        </div>
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} FC Studio. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
