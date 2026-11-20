import { BriefingStatus } from '@/lib/turso/repository';

export const STATUS_LABELS: Record<BriefingStatus, string> = {
  novo: 'Novo',
  em_analise: 'Em análise',
  proposta_enviada: 'Proposta enviada',
  feito: 'Feito',
  em_producao: 'Em produção',
};

export const STATUS_BADGE_CLASSES: Record<BriefingStatus, string> = {
  novo: 'bg-slate-100 text-slate-700',
  em_analise: 'bg-amber-50 text-amber-800',
  proposta_enviada: 'bg-blue-50 text-blue-700',
  feito: 'bg-purple-50 text-purple-700',
  em_producao: 'bg-emerald-50 text-emerald-700',
};

export function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function parseAmountInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}
