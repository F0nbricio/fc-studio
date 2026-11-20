export type ProjectTier = 'landing_page' | 'institutional' | 'custom_system_ecommerce';

export interface PricingEstimateInput {
  tier: ProjectTier;
  featuresCount: number;
  needsCustomDomain: boolean;
  estimatedDomainYearlyBrl?: number;
  includeMonthlyCare?: boolean;
}

export interface PricingEstimateOutput {
  baseDevelopmentBrl: number;
  featuresAdjustmentBrl: number;
  domainCostBrl: number;
  totalInitialEstimateBrl: number;
  suggestedMonthlyCareBrl: number;
  notes: string[];
}
