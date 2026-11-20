import { BriefingFormData } from '@/types/briefing';

function sanitizeText(value?: string): string {
  if (!value) return '';
  return value.replace(/[<>]/g, '').trim();
}

// Prompt técnico PRIVATIVO: fica salvo no Turso e acessível apenas no seu painel /admin.
// Nunca deve ir para a URL do WhatsApp ou para respostas públicas ao cliente.
export function buildGeminiProjectPrompt(data: BriefingFormData): string {
  const clientName = sanitizeText(data.clientName);
  const projectType = sanitizeText(data.projectType);
  const businessGoal = sanitizeText(data.businessGoal);
  const designStyle = sanitizeText(data.designStyle) || 'Moderno e Profissional';
  const notes = sanitizeText(data.additionalNotes);
  const features =
    data.desiredFeatures.length > 0
      ? data.desiredFeatures.map((item) => `- ${sanitizeText(item)}`).join('\n')
      : '- Estrutura essencial otimizada para conversão e apresentação profissional';

  return [
    '=== ESCOPO TÉCNICO DE PROJETO WEB — FC STUDIO ===',
    '',
    '1. CONTEXTO DO CLIENTE E OBJETIVO',
    `- Solicitante: ${clientName}`,
    `- Tipo de Projeto: ${projectType}`,
    `- Objetivo Principal: ${businessGoal}`,
    `- Identidade Visual / Domínio Próprio: ${data.hasDomainOrBrand ? 'Já possui marca/domínio' : 'Precisa de definição visual e estrutura inicial'}`,
    `- Direção Estética Desejada: ${designStyle}`,
    '',
    '2. FUNCIONALIDADES E REQUISITOS SOLICITADOS',
    features,
    '',
    '3. OBSERVAÇÕES ESPECÍFICAS DO CLIENTE',
    notes ? notes : 'Nenhuma observação extra informada.',
    '',
    '4. DIRETRIZES OBRIGATÓRIAS DE ENGENHARIA (PADRÃO FC STUDIO)',
    '- Organizar previamente a arquitetura modular e apresentar a árvore de pastas antes de gerar código.',
    '- Modelar o banco de dados com restrições de integridade, índices otimizados e isolamento de acesso seguro.',
    '- Entregar código limpo, modulado, responsivo, otimizado para SEO/Core Web Vitals e sem código morto.',
    '- Gerar script executável .cjs idempotente para criação/atualização imediata dos arquivos.',
  ].join('\n');
}

// Mensagem pública para o WhatsApp: contém apenas o resumo comercial do lead,
// sem expor o prompt técnico ou diretrizes de engenharia ao cliente.
export function buildWhatsappShareLink(
  whatsappNumber: string,
  data: BriefingFormData
): string {
  const cleanPhone = whatsappNumber.replace(/\D/g, '');
  const clientName = sanitizeText(data.clientName);
  const projectType = sanitizeText(data.projectType);
  const businessGoal = sanitizeText(data.businessGoal);

  const summary = [
    `Olá, *FC Studio*! Me chamo *${clientName}* e acabei de enviar minha solicitação pelo site.`,
    `*Tipo de site:* ${projectType}`,
    `*Objetivo:* ${businessGoal}`,
    '',
    'Aguardo retorno para alinharmos os próximos passos.',
  ].join('\n');

  const encoded = encodeURIComponent(summary);
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
