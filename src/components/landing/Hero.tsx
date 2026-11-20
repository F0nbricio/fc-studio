import React from 'react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white pt-16 pb-20 sm:pt-24 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Sites sob medida, rápidos e{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              blindados em segurança
            </span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
            Crio páginas institucionais, landing pages de alta conversão, lojas virtuais e sistemas
            web personalizados. Arquitetura modular, revisão rigorosa antes da entrega e suporte
            direto para qualquer dúvida ou ajuste.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <a
              href="#briefing"
              className="w-full rounded-xl bg-blue-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto"
            >
              Montar Meu Briefing Agora
            </a>
            <a
              href="#como-funciona"
              className="w-full rounded-xl border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              Ver Como Funciona
            </a>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-8 text-left sm:grid-cols-4">
            <div>
              <p className="text-sm font-bold text-slate-900">100% Legal & Sob Medida</p>
              <p className="mt-0.5 text-xs text-slate-500">Código autoral e licenciado para seu negócio</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Arquitetura Modular</p>
              <p className="mt-0.5 text-xs text-slate-500">Fácil de escalar e manter no futuro</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Segurança & Proteção</p>
              <p className="mt-0.5 text-xs text-slate-500">Proteção de dados e validação ponta a ponta</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Suporte Humano Real</p>
              <p className="mt-0.5 text-xs text-slate-500">Acompanhamento após a entrega</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
