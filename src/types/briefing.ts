export interface BriefingFormData {
  clientName: string;
  clientWhatsapp: string;
  clientEmail?: string;
  projectType: string;
  businessGoal: string;
  desiredFeatures: string[];
  designStyle: string;
  hasDomainOrBrand: boolean;
  additionalNotes?: string;
}

export interface BriefingSubmissionResult {
  success: boolean;
  persisted: boolean;
  whatsappUrl: string;
  message: string;
}
