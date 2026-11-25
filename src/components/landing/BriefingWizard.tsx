'use client';

import React, { useState } from 'react';
import { BriefingFormData, BriefingSubmissionResult } from '@/types/briefing';
import { extractPhoneDigits, maskPhoneBr } from '@/lib/phone-mask';

const PROJECT_TYPES = [
  'Site Institucional / Empresa',
  'Landing Page de Alta Conversão',
  'Loja Virtual / E-commerce',
  'Portfólio Profissional',
  'Sistema Web / Agendamento / Catálogo',
  'Aplicativo Mobile (B2C / B2B)',
  'Outro Projeto Sob Demanda',
];

const FEATURE_OPTIONS = [
  'Botão direto para WhatsApp',
  'Formulário de orçamento / contato',
  'Catálogo de produtos ou serviços',
  'Integração com pagamentos (Pix / Cartão)',
  'Área administrativa para editar conteúdos',
  'Otimização para aparecer no Google (SEO)',
  'Mapa de localização e redes sociais',
  'Depoimentos e provas sociais',
];

const DESIGN_STYLES = [
  'Moderno e Minimalista',
  'Corporativo e Sério',
  'Criativo e Vibrante',
  'Elegante e Sofisticado',
];

const INITIAL_FORM: BriefingFormData = {
  clientName: '',
  clientWhatsapp: '',
  clientEmail: '',
  projectType: PROJECT_TYPES[0],
  businessGoal: '',
  desiredFeatures: ['Botão direto para WhatsApp', 'Otimização para aparecer no Google (SEO)'],
  designStyle: DESIGN_STYLES[0],
  hasDomainOrBrand: false,
  additionalNotes: '',
};

export function BriefingWizard() {
  const [formData, setFormData] = useState<BriefingFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<BriefingSubmissionResult | null>(null);

  function toggleFeature(feature: string) {
    setFormData((prev) => {
      const exists = prev.desiredFeatures.includes(feature);
      return {
        ...prev,
        desiredFeatures: exists
          ? prev.desiredFeatures.filter((item) => item !== feature)
          : [...prev.desiredFeatures, feature],
      };
    });
  }

  function handleWhatsappChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskPhoneBr(e.target.value);
    setFormData((prev) => ({ ...prev, clientWhatsapp: masked }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const digits = extractPhoneDigits(formData.clientWhatsapp);
    if (digits.length < 10) {
      setError('Digite um número de celular válido com DDD, ex.: (31) 99999-9999.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/briefings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          clientWhatsapp: digits,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Verifique os campos preenchidos e tente novamente.');
        setLoading(false);
        return;
      }

      const submission = data as BriefingSubmissionResult;
      setSubmitted(submission);

      if (submission.whatsappUrl) {
        const popup = window.open(submission.whatsappUrl, '_blank', 'noopener,noreferrer');
        if (!popup) {
          window.location.href = submission.whatsappUrl;
        }
      }
    } catch {
      setError('Falha de conexão ao enviar o briefing. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSubmitted(null);
    setError(null);
    setFormData(INITIAL_FORM);
  }

  return (
    <section id="briefing" className="border-t border-slate-200 bg-slate-950 py-20 text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-block rounded-full bg-blue-500/15 px-3.5 py-1 text-xs font-semibold text-blue-300">
            Solicitar Orçamento
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Conte o que você precisa para o seu site
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Preencha este formulário rápido. Ao enviar, os detalhes seguem direto para o WhatsApp do
            FC Studio para iniciarmos o atendimento do seu projeto.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl sm:p-10">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-200">
                    Seu nome ou empresa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Mariana Silva / Studio Bella"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="clientWhatsapp"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Seu WhatsApp (com DDD) *
                  </label>
                  <input
                    id="clientWhatsapp"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                    maxLength={15}
                    placeholder="Ex.: (31) 99999-9999"
                    value={formData.clientWhatsapp}
                    onChange={handleWhatsappChange}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-200">
                    Qual tipo de site você deseja? *
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    {PROJECT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200">
                    Estilo visual preferido
                  </label>
                  <select
                    value={formData.designStyle}
                    onChange={(e) => setFormData({ ...formData, designStyle: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    {DESIGN_STYLES.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Qual é o principal objetivo desse site para o seu negócio? *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex.: Atrair clientes locais para minha clínica, apresentar meus serviços com credibilidade e receber pedidos de orçamento direto no WhatsApp."
                  value={formData.businessGoal}
                  onChange={(e) => setFormData({ ...formData, businessGoal: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-200">
                  Recursos que você gostaria de incluir
                </span>
                <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                  {FEATURE_OPTIONS.map((feature) => {
                    const checked = formData.desiredFeatures.includes(feature);
                    return (
                      <button
                        type="button"
                        key={feature}
                        onClick={() => toggleFeature(feature)}
                        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition ${
                          checked
                            ? 'border-blue-500 bg-blue-500/15 text-blue-200'
                            : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            checked
                              ? 'border-blue-400 bg-blue-500 text-white'
                              : 'border-slate-600'
                          }`}
                        >
                          {checked ? '✓' : ''}
                        </span>
                        <span>{feature}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <input
                  id="hasDomain"
                  type="checkbox"
                  checked={formData.hasDomainOrBrand}
                  onChange={(e) =>
                    setFormData({ ...formData, hasDomainOrBrand: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                />
                <label htmlFor="hasDomain" className="text-sm text-slate-300">
                  Já possuo logotipo, cores da marca ou domínio registrado
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Referências ou detalhes extras (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex.: Links de sites que você gosta, prazo desejado ou funcionalidades específicas."
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:opacity-60"
              >
                {loading ? 'Enviando para o WhatsApp...' : 'Enviar Solicitação para o WhatsApp'}
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl font-bold text-emerald-300">
                ✓
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  Solicitação enviada com sucesso!
                </h3>
                <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-300">
                  Recebemos as informações do seu projeto. A conversa no WhatsApp com o FC Studio foi
                  aberta automaticamente para continuarmos o atendimento.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                {submitted.whatsappUrl && (
                  <a
                    href={submitted.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-xl bg-emerald-600 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-500 sm:w-auto"
                  >
                    Abrir WhatsApp Novamente
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full rounded-xl border border-slate-700 px-5 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 sm:w-auto"
                >
                  Enviar Outra Solicitação
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
