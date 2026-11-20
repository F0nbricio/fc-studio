export interface ProposalMessageInput {
  clientName: string;
  clientWhatsapp: string;
  projectType: string;
  businessGoal: string;
  desiredFeatures: string[];
  agreedAmountBrl: number | null;
  fallbackEstimateBrl: number;
  commercialNotes: string | null;
}

function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function buildClientProposalMessage(input: ProposalMessageInput): string {
  const cleanName = input.clientName.trim() || 'Cliente';
  const cleanType = input.projectType.trim();
  const cleanGoal = input.businessGoal.trim();
  const hasAgreedAmount =
    input.agreedAmountBrl !== null &&
    Number.isFinite(input.agreedAmountBrl) &&
    input.agreedAmountBrl > 0;

  const displayAmount = hasAgreedAmount
    ? formatBrl(input.agreedAmountBrl as number)
    : `${formatBrl(input.fallbackEstimateBrl)} (estimativa inicial)`;

  const featuresBlock =
    input.desiredFeatures.length > 0
      ? input.desiredFeatures.map((feat) => `• ${feat}`).join('\n')
      : '• Estrutura sob medida conforme alinhamento inicial';

  const lines: string[] = [
    `Olá, *${cleanName}*! Tudo bem? Aqui é do *FC Studio*.`,
    '',
    `Analisei seu briefing para *${cleanType}* com foco em: ${cleanGoal}`,
    '',
    '*Principais recursos previstos:*',
    featuresBlock,
    '',
    `*Investimento proposto:* ${displayAmount}`,
  ];

  if (input.commercialNotes && input.commercialNotes.trim().length > 0) {
    lines.push(`*Condições / Observações:* ${input.commercialNotes.trim()}`);
  }

  lines.push(
    '',
    'O projeto é entregue com estrutura modular, verificação pré-entrega e suporte direto para dúvidas ou ajustes.',
    'Se fizer sentido para você, já podemos alinhar os próximos passos por aqui!'
  );

  return lines.join('\n');
}

export function buildClientWhatsappUrl(rawPhone: string, message: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  const normalizedPhone =
    digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  const encoded = encodeURIComponent(message);

  return normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
