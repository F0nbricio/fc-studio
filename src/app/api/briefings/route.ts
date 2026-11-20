import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { BriefingFormData } from '@/types/briefing';
import { buildGeminiProjectPrompt, buildWhatsappShareLink } from '@/lib/prompt-builder';
import { checkRateLimit, extractClientIp } from '@/lib/security/rate-limit';
import {
  createPublicBriefing,
  isValidBriefingStatus,
  listAdminBriefings,
  updateBriefingCommercialDetails,
} from '@/lib/turso/repository';
import { extractPhoneDigits } from '@/lib/phone-mask';

function isAuthorizedAdmin(request: Request): boolean {
  const expectedSecret = process.env.ADMIN_API_SECRET?.trim();
  const providedSecret = request.headers.get('x-admin-token')?.trim();

  if (!expectedSecret || !providedSecret) return false;
  if (expectedSecret.length !== providedSecret.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(expectedSecret, 'utf8'),
    Buffer.from(providedSecret, 'utf8')
  );
}

function enforceAdminRateLimit(request: Request, action: string) {
  const ip = extractClientIp(request);
  const check = checkRateLimit(action + ":" + ip, 30, 60_000);
  if (!check.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: 'Muitas tentativas em sequência. Aguarde ' + check.retryAfterSec + 's e tente novamente.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(check.retryAfterSec), 'Cache-Control': 'no-store' },
      }
    );
  }
  return null;
}

export async function GET(request: Request) {
  const limited = enforceAdminRateLimit(request, 'admin-get');
  if (limited) return limited;

  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      { success: false, message: 'Senha incorreta ou não informada.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '50');
    const briefings = await listAdminBriefings(limit);

    return NextResponse.json(
      {
        success: true,
        total: briefings.length,
        briefings,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erro ao consultar briefings no banco.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function PATCH(request: Request) {
  const limited = enforceAdminRateLimit(request, 'admin-patch');
  if (limited) return limited;

  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json(
      { success: false, message: 'Acesso não autorizado.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      status?: string;
      agreedAmountBrl?: number | string | null;
      commercialNotes?: string | null;
    };

    const id = (body.id || '').trim();
    const status = (body.status || '').trim();

    if (!id || !isValidBriefingStatus(status)) {
      return NextResponse.json(
        { success: false, message: 'ID ou status inválido.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    let agreedAmountBrl: number | null = null;
    if (
      body.agreedAmountBrl !== undefined &&
      body.agreedAmountBrl !== null &&
      String(body.agreedAmountBrl).trim() !== ''
    ) {
      const normalizedNumber = Number(String(body.agreedAmountBrl).replace(',', '.'));
      if (!Number.isFinite(normalizedNumber) || normalizedNumber < 0) {
        return NextResponse.json(
          { success: false, message: 'Informe um valor válido em reais.' },
          { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
      }
      agreedAmountBrl = Math.round(normalizedNumber * 100) / 100;
    }

    const sanitizedNotes =
      typeof body.commercialNotes === 'string' && body.commercialNotes.trim().length > 0
        ? body.commercialNotes.replace(/[<>]/g, '').trim().slice(0, 1000)
        : null;

    const updated = await updateBriefingCommercialDetails(id, {
      status,
      agreedAmountBrl,
      commercialNotes: sanitizedNotes,
    });

    if (!updated.ok) {
      return NextResponse.json(
        { success: false, message: 'Não foi possível atualizar os dados no banco.' },
        { status: updated.reason === 'NOT_FOUND' ? 404 : 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id,
        status,
        agreedAmountBrl,
        commercialNotes: sanitizedNotes,
        message: 'Acompanhamento comercial salvo com sucesso.',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erro ao processar atualização.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<BriefingFormData>;

    const clientName = (body.clientName || '').trim();
    const rawWhatsapp = (body.clientWhatsapp || '').trim();
    const phoneDigits = extractPhoneDigits(rawWhatsapp);
    const projectType = (body.projectType || '').trim();
    const businessGoal = (body.businessGoal || '').trim();

    if (clientName.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Informe seu nome para continuarmos.' },
        { status: 400 }
      );
    }

    if (phoneDigits.length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: 'Informe um número de celular válido com DDD (10 ou 11 dígitos).',
        },
        { status: 400 }
      );
    }

    if (!projectType || businessGoal.length < 5) {
      return NextResponse.json(
        {
          success: false,
          message: 'Descreva o tipo de site e o objetivo principal.',
        },
        { status: 400 }
      );
    }

    const sanitizedData: BriefingFormData = {
      clientName: clientName.slice(0, 120),
      clientWhatsapp: phoneDigits,
      clientEmail: body.clientEmail ? body.clientEmail.trim().slice(0, 150) : undefined,
      projectType: projectType.slice(0, 100),
      businessGoal: businessGoal.slice(0, 1000),
      desiredFeatures: Array.isArray(body.desiredFeatures)
        ? body.desiredFeatures.slice(0, 15).map((item) => String(item).trim().slice(0, 120))
        : [],
      designStyle: (body.designStyle || 'Moderno e Minimalista').trim().slice(0, 80),
      hasDomainOrBrand: Boolean(body.hasDomainOrBrand),
      additionalNotes: body.additionalNotes
        ? body.additionalNotes.trim().slice(0, 1500)
        : undefined,
    };

    const privatePrompt = buildGeminiProjectPrompt(sanitizedData);
    const ownerWhatsapp = process.env.NEXT_PUBLIC_OWNER_WHATSAPP || '';
    const whatsappUrl = buildWhatsappShareLink(ownerWhatsapp, sanitizedData);

    const dbResult = await createPublicBriefing(sanitizedData, privatePrompt);

    return NextResponse.json({
      success: true,
      persisted: dbResult.ok,
      whatsappUrl,
      message: 'Solicitação enviada! Redirecionando para o WhatsApp...',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Não foi possível processar sua solicitação agora.' },
      { status: 500 }
    );
  }
}
