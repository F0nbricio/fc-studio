import React from 'react';

const STEPS = [
  {
    step: '01',
    title: 'Você preenche o briefing simples',
    description:
      'Responda algumas perguntas rápidas logo abaixo sobre o objetivo do seu site, estilo visual e recursos desejados.',
  },
  {
    step: '02',
    title: 'Geração de Especificação Inteligente',
    description:
      'O sistema organiza suas necessidades em um escopo técnico claro para estruturarmos a solução ideal com agilidade.',
  },
  {
    step: '03',
    title: 'Desenvolvimento Modulado & Verificação',
    description:
      'Construo o site sob medida, testo cada detalhe de segurança, velocidade e mobile antes de apresentar a versão final.',
  },
  {
    step: '04',
    title: 'Publicação e Suporte Contínuo',
    description:
      'Colocamos seu site no ar de forma profissional e você conta com meu atendimento direto para qualquer dúvida ou ajuste.',
  },
];

export function Process() {
  return (
    <section id="como-funciona" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Do seu objetivo ao site no ar em 4 etapas
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Processo transparente, sem termos complicados e com acompanhamento próximo em cada fase.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="text-3xl font-black text-blue-600/20">{item.step}</span>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
