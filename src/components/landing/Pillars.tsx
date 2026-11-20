import React from 'react';

const PILLARS = [
  {
    title: 'Engenharia Assistida por IA de Ponta',
    description:
      'Utilizo modelos avançados de Inteligência Artificial integrados ao meu fluxo de engenharia de software para acelerar entregas sem abrir mão de arquitetura limpa, revisão humana e rigor técnico.',
    badge: 'Agilidade + Precisão',
  },
  {
    title: 'Código Modulado e Otimizado',
    description:
      'Nada de templates pesados ou genéricos. Cada componente é construído sob demanda para carregar rápido no celular, ranquear bem no Google e converter visitantes.',
    badge: 'Performance',
  },
  {
    title: 'Segurança por Padrão e Validação',
    description:
      'Formulários, bancos de dados e integrações nascem protegidos com acesso restrito no servidor, sanitização de entradas e boas práticas de mercado.',
    badge: 'Proteção de Dados',
  },
  {
    title: 'Auditoria Pré-Entrega e Suporte Ativo',
    description:
      'Antes de colocar seu site no ar, realizo um checklist completo de qualidade, responsividade e links. Após a entrega, sigo à disposição para dúvidas ou correções.',
    badge: 'Tranquilidade',
  },
];

export function Pillars() {
  return (
    <section id="diferenciais" className="border-t border-slate-100 bg-slate-50/60 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Por que desenvolver seu site com o FC Studio?
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Combino design visual cuidadoso, desenvolvimento moderno e inteligência artificial para
            entregar projetos profissionais com transparência total.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {PILLARS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <span className="inline-block rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {item.badge}
              </span>
              <h3 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
