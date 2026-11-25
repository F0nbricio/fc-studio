import { PricingEstimateInput, PricingEstimateOutput, ProjectTier } from '@/types/pricing';

const BASE_PRICES_BRL: Record<ProjectTier, number> = {
  landing_page: 1100,
  institutional: 2200,
  custom_system_ecommerce: 4200,
};

const MONTHLY_CARE_BRL: Record<ProjectTier, number> = {
  landing_page: 180,
  institutional: 250,
  custom_system_ecommerce: 390,
};

export function mapProjectTypeToTier(projectType: string): ProjectTier {
  const normalized = projectType.toLowerCase();
  if (normalized.includes('landing')) return 'landing_page';
  if (
    normalized.includes('loja') ||
    normalized.includes('e-commerce') ||
    normalized.includes('sistema') ||
    normalized.includes('catálogo') ||
    normalized.includes('aplicativo') ||
    normalized.includes('app') ||
    normalized.includes('mobile') ||
    normalized.includes('b2c') ||
    normalized.includes('b2b')
  ) {
    return 'custom_system_ecommerce';
  }
  return 'institutional';
}

export function calculateProjectEstimate(input: PricingEstimateInput): PricingEstimateOutput {
  const baseDevelopmentBrl = BASE_PRICES_BRL[input.tier] ?? BASE_PRICES_BRL.institutional;
  const safeFeaturesCount = Math.max(0, Math.min(Number(input.featuresCount) || 0, 20));
  const extraFeatures = Math.max(0, safeFeaturesCount - 2);
  const featuresAdjustmentBrl = extraFeatures * 180;

  const domainCostBrl = input.needsCustomDomain
    ? Math.max(0, Number(input.estimatedDomainYearlyBrl) || 45)
    : 0;

  const totalInitialEstimateBrl = baseDevelopmentBrl + featuresAdjustmentBrl + domainCostBrl;
  const suggestedMonthlyCareBrl =
    input.includeMonthlyCare === false
      ? 0
      : MONTHLY_CARE_BRL[input.tier] ?? MONTHLY_CARE_BRL.institutional;

  const notes: string[] = [
    'Infraestrutura inicial em planos gratuitos (Vercel + Turso/Supabase Free) quando compatível com o volume do projeto.',
    'Inclui arquitetura modular, verificação pré-entrega e garantia inicial contra falhas do código entregue.',
  ];

  if (input.needsCustomDomain) {
    notes.push(
      `Inclui estimativa de domínio próprio (${domainCostBrl.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })}) para repasse/registro do cliente.`
    );
  } else {
    notes.push('Sem custo de domínio próprio incluído nesta estimativa.');
  }

  return {
    baseDevelopmentBrl,
    featuresAdjustmentBrl,
    domainCostBrl,
    totalInitialEstimateBrl,
    suggestedMonthlyCareBrl,
    notes,
  };
}
