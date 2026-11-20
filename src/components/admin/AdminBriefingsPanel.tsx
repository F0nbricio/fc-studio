'use client';

import React, { useState } from 'react';
import { maskPhoneBr } from '@/lib/phone-mask';
import { calculateProjectEstimate, mapProjectTypeToTier } from '@/lib/pricing-calculator';
import { buildClientProposalMessage, buildClientWhatsappUrl } from '@/lib/proposal-message';
import { ALLOWED_BRIEFING_STATUSES, BriefingStatus } from '@/lib/turso/repository';
import { formatBrl, parseAmountInput, STATUS_BADGE_CLASSES, STATUS_LABELS } from '@/lib/admin-helpers';

interface AdminBriefingItem {
  id: string;
  client_name: string;
  client_whatsapp: string;
  project_type: string;
  business_goal: string;
  desired_features: string[];
  design_style: string;
  has_domain_or_brand: boolean;
  additional_notes: string | null;
  generated_gemini_prompt: string;
  status: BriefingStatus;
  agreed_amount_brl: number | null;
  commercial_notes: string | null;
  created_at: string;
}

interface DraftCommercialState {
  status: BriefingStatus;
  amountInput: string;
  notesInput: string;
}

type FilterMode = 'todos' | BriefingStatus;

function buildDraftsMap(items: AdminBriefingItem[]): Record<string, DraftCommercialState> {
  const map: Record<string, DraftCommercialState> = {};
  for (const item of items) {
    map[item.id] = {
      status: item.status,
      amountInput:
        item.agreed_amount_brl !== null && item.agreed_amount_brl !== undefined
          ? String(item.agreed_amount_brl)
          : '',
      notesInput: item.commercial_notes || '',
    };
  }
  return map;
}

export function AdminBriefingsPanel() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [briefings, setBriefings] = useState<AdminBriefingItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftCommercialState>>({});
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedProposalId, setCopiedProposalId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function fetchBriefings(secret: string) {
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch('/api/briefings?limit=50', {
        method: 'GET',
        headers: {
          'x-admin-token': secret.trim(),
        },
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Senha incorreta.');
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      const list: AdminBriefingItem[] = Array.isArray(data.briefings) ? data.briefings : [];
      setBriefings(list);
      setDrafts(buildDraftsMap(list));
      setAuthenticated(true);
    } catch {
      setError('Erro de conexão ao tentar entrar.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError('Digite sua senha para continuar.');
      return;
    }
    await fetchBriefings(password);
  }

  async function handleCopyPrompt(item: AdminBriefingItem) {
    await navigator.clipboard.writeText(item.generated_gemini_prompt);
    setCopiedPromptId(item.id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  }

  async function handleCopyProposal(itemId: string, proposalText: string) {
    await navigator.clipboard.writeText(proposalText);
    setCopiedProposalId(itemId);
    setTimeout(() => setCopiedProposalId(null), 2500);
  }

  function updateDraft(
    itemId: string,
    patch: Partial<DraftCommercialState>,
    fallbackItem: AdminBriefingItem
  ) {
    setDrafts((prev) => {
      const current = prev[itemId] || {
        status: fallbackItem.status,
        amountInput:
          fallbackItem.agreed_amount_brl !== null && fallbackItem.agreed_amount_brl !== undefined
            ? String(fallbackItem.agreed_amount_brl)
            : '',
        notesInput: fallbackItem.commercial_notes || '',
      };

      return {
        ...prev,
        [itemId]: {
          ...current,
          ...patch,
        },
      };
    });
  }

  async function handleSaveCommercial(item: AdminBriefingItem) {
    const draft = drafts[item.id] || {
      status: item.status,
      amountInput: item.agreed_amount_brl !== null ? String(item.agreed_amount_brl) : '',
      notesInput: item.commercial_notes || '',
    };

    setSavingId(item.id);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch('/api/briefings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': password.trim(),
        },
        body: JSON.stringify({
          id: item.id,
          status: draft.status,
          agreedAmountBrl: draft.amountInput.trim() === '' ? null : draft.amountInput.trim(),
          commercialNotes: draft.notesInput.trim() === '' ? null : draft.notesInput.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Não foi possível salvar os dados comerciais.');
        setSavingId(null);
        return;
      }

      setBriefings((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                status: draft.status,
                agreed_amount_brl: data.agreedAmountBrl ?? null,
                commercial_notes: data.commercialNotes ?? null,
              }
            : row
        )
      );
      setFeedback('Dados de ' + item.client_name + ' salvos com sucesso.');
    } catch {
      setError('Falha de rede ao salvar.');
    } finally {
      setSavingId(null);
    }
  }

  const totalAgreedBrl = briefings.reduce((acc, row) => {
    return acc + (row.agreed_amount_brl && row.agreed_amount_brl > 0 ? row.agreed_amount_brl : 0);
  }, 0);

  const visibleBriefings = filterMode === 'todos'
    ? briefings
    : briefings.filter((b) => b.status === filterMode);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
        <div>
          <span className="inline-block rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
            FC Studio
          </span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Briefings Recebidos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe status, valor combinado, observações, gere propostas no WhatsApp e copie o prompt.
          </p>
        </div>

        {authenticated && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-right">
              <span className="block text-[11px] font-medium text-emerald-700">
                Total Combinado
              </span>
              <strong className="text-sm font-extrabold text-emerald-950">
                {formatBrl(totalAgreedBrl)}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => fetchBriefings(password)}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Atualizar Lista
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthenticated(false);
                setPassword('');
                setBriefings([]);
                setDrafts({});
              }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        )}
      </div>

      {!authenticated ? (
        <form
          onSubmit={handleLogin}
          className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="text-lg font-bold text-slate-900">Acesso Restrito</h2>
          <p className="mt-1 text-sm text-slate-500">
            Digite sua senha para acessar os briefings e prompts.
          </p>

          <div className="mt-5">
            <label htmlFor="adminPasswordInput" className="block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="adminPasswordInput"
              type="password"
              required
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode('todos')}
              className={'rounded-xl px-3 py-1.5 text-xs font-semibold transition ' + (filterMode === 'todos' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
            >
              Todos ({briefings.length})
            </button>
            {ALLOWED_BRIEFING_STATUSES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterMode(st)}
                className={'rounded-xl px-3 py-1.5 text-xs font-semibold transition ' + (filterMode === st ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
              >
                {STATUS_LABELS[st]}
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {feedback && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
              {feedback}
            </div>
          )}

          {visibleBriefings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-sm font-semibold text-slate-800">
                Nenhum briefing encontrado para este filtro.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Altere o filtro acima ou aguarde novos envios de clientes.
              </p>
            </div>
          ) : (
            visibleBriefings.map((item) => {
              const tier = mapProjectTypeToTier(item.project_type);
              const estimate = calculateProjectEstimate({
                tier,
                featuresCount: Array.isArray(item.desired_features)
                  ? item.desired_features.length
                  : 0,
                needsCustomDomain: !item.has_domain_or_brand,
                estimatedDomainYearlyBrl: 45,
                includeMonthlyCare: true,
              });

              const draft = drafts[item.id] || {
                status: item.status,
                amountInput:
                  item.agreed_amount_brl !== null && item.agreed_amount_brl !== undefined
                    ? String(item.agreed_amount_brl)
                    : '',
                notesInput: item.commercial_notes || '',
              };

              const activeAmount = parseAmountInput(draft.amountInput) ?? item.agreed_amount_brl;
              const activeNotes =
                draft.notesInput.trim().length > 0 ? draft.notesInput.trim() : item.commercial_notes;

              const proposalMessage = buildClientProposalMessage({
                clientName: item.client_name,
                clientWhatsapp: item.client_whatsapp,
                projectType: item.project_type,
                businessGoal: item.business_goal,
                desiredFeatures: item.desired_features,
                agreedAmountBrl: activeAmount,
                fallbackEstimateBrl: estimate.totalInitialEstimateBrl,
                commercialNotes: activeNotes,
              });

              const clientWhatsappUrl = buildClientWhatsappUrl(
                item.client_whatsapp,
                proposalMessage
              );

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-950">{item.client_name}</h2>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {item.project_type}
                        </span>
                        <span
                          className={'rounded-full px-2.5 py-0.5 text-xs font-semibold ' + STATUS_BADGE_CLASSES[item.status]}
                        >
                          {STATUS_LABELS[item.status]}
                        </span>
                        {item.agreed_amount_brl !== null && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                            Fechado: {formatBrl(item.agreed_amount_brl)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        WhatsApp: <strong>{maskPhoneBr(item.client_whatsapp)}</strong> • Enviado em: {
                          new Date(item.created_at).toLocaleString('pt-BR')
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(item)}
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      {copiedPromptId === item.id ? 'Prompt Copiado!' : 'Copiar Prompt'}
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Estimativa de Referência (Uso Interno)
                    </p>
                    <div className="mt-2 flex flex-wrap gap-6 text-sm">
                      <div>
                        <span className="block text-xs text-slate-500">Valor Inicial Estimado</span>
                        <strong className="text-base text-slate-950">
                          {formatBrl(estimate.totalInitialEstimateBrl)}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Acompanhamento Mensal</span>
                        <strong className="text-base text-slate-950">
                          {formatBrl(estimate.suggestedMonthlyCareBrl)}/mês
                        </strong>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Domínio Próprio (Ref.)</span>
                        <strong className="text-base text-slate-950">
                          {formatBrl(estimate.domainCostBrl)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Controle de Etapa e Valor Combinado
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <label
                          htmlFor={'status-' + item.id}
                          className="block text-xs font-medium text-slate-700"
                        >
                          Status do Projeto
                        </label>
                        <select
                          id={'status-' + item.id}
                          value={draft.status}
                          onChange={(e) =>
                            updateDraft(
                              item.id,
                              { status: e.target.value as BriefingStatus },
                              item
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                        >
                          {ALLOWED_BRIEFING_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {STATUS_LABELS[st]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor={'amount-' + item.id}
                          className="block text-xs font-medium text-slate-700"
                        >
                          Valor Combinado (R$)
                        </label>
                        <input
                          id={'amount-' + item.id}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Ex.: 1800"
                          value={draft.amountInput}
                          onChange={(e) =>
                            updateDraft(item.id, { amountInput: e.target.value }, item)
                          }
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={'notes-' + item.id}
                          className="block text-xs font-medium text-slate-700"
                        >
                          Observação Comercial
                        </label>
                        <input
                          id={'notes-' + item.id}
                          type="text"
                          placeholder="Ex.: Inclui domínio .com.br + Pix"
                          value={draft.notesInput}
                          onChange={(e) =>
                            updateDraft(item.id, { notesInput: e.target.value }, item)
                          }
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() => handleSaveCommercial(item)}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        {savingId === item.id ? 'Salvando...' : 'Salvar Acompanhamento'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                        Mensagem de Proposta Pronta para o Cliente
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyProposal(item.id, proposalMessage)}
                          className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100/60"
                        >
                          {copiedProposalId === item.id ? 'Proposta Copiada!' : 'Copiar Proposta'}
                        </button>
                        <a
                          href={clientWhatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Enviar no WhatsApp do Cliente
                        </a>
                      </div>
                    </div>

                    <pre className="mt-2.5 max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-emerald-200/70 bg-white p-3.5 font-sans text-xs leading-relaxed text-slate-800">
                      {proposalMessage}
                    </pre>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Objetivo Informado
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{item.business_goal}</p>
                  </div>

                  <div className="mt-4">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Prompt Estruturado
                    </p>
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
                      {item.generated_gemini_prompt}
                    </pre>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
