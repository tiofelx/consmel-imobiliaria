import { NextResponse } from 'next/server';
import transporter from '@/lib/mailer';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import rateLimit from '@/lib/rate-limit';
import { getClientIpFromHeaders } from '@/lib/request-security';

export const dynamic = 'force-dynamic';

const limiter = rateLimit({ uniqueTokenPerInterval: 500, interval: 600000 });

const leadSchema = z.object({
    name: z.string().trim().min(2, 'Nome muito curto').max(100, 'Nome muito longo')
        .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, 'Nome contém caracteres inválidos'),
    email: z.string().trim().email('E-mail inválido').max(150),
    phone: z.string().trim().min(8, 'WhatsApp inválido').max(25, 'WhatsApp muito longo'),
});

export async function POST(request) {
    const ip = getClientIpFromHeaders(request.headers);
    const resForHeaders = new NextResponse();

    try {
        await limiter.check(resForHeaders, 5, `RATE_LIMIT_LANCAMENTO_${ip}`);
    } catch {
        return NextResponse.json(
            { error: 'Muitas requisições. Tente novamente mais tarde.' },
            { status: 429 }
        );
    }

    let data;
    try {
        data = await request.json();
    } catch {
        return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
    }

    const parsed = leadSchema.safeParse(data);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Dados inválidos', details: parsed.error.errors },
            { status: 400 }
        );
    }

    const { name, email, phone } = parsed.data;

    try {
        const lead = await prisma.lancamentoLead.create({
            data: { name, email, phone },
        });

        // Fire-and-forget — vault: never break request flow for notification failures
        notifyNewLead({ name, email, phone }).catch(() => {});

        const response = NextResponse.json({ success: true, id: lead.id }, { status: 201 });
        resForHeaders.headers.forEach((value, key) => response.headers.set(key, value));
        return response;
    } catch (error) {
        console.error('Erro ao salvar lead de lançamento:', error);
        return NextResponse.json(
            { error: 'Erro ao salvar cadastro. Tente novamente.' },
            { status: 500 }
        );
    }
}

async function notifyNewLead({ name, email, phone }) {
    const from = process.env.GMAIL_USER;
    const to = process.env.LANCAMENTO_NOTIFY_EMAIL || process.env.SECURITY_ALERT_EMAIL_TO;

    if (!from || !to) return;

    const date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const waLink = `https://wa.me/55${phone.replace(/\D/g, '')}`;

    await transporter.sendMail({
        from: `Consmel Imobiliária <${from}>`,
        to,
        subject: 'Novo Lead — Lançamento do Novo Lote · Consmel',
        html: buildEmailHtml({ name, email, phone, waLink, date }),
    });
}

function buildEmailHtml({ name, email, phone, waLink, date }) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Novo Lead — Lançamento Consmel</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:#1e3a5f;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:rgba(255,255,255,0.55);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">
                Lançamento · Consmel Imobiliária
              </p>
              <h1 style="margin:0;color:white;font-size:22px;font-weight:800;line-height:1.3;">
                Novo Lead Cadastrado
              </h1>
              <p style="margin:8px 0 0;color:#ff9068;font-size:13px;font-weight:600;">
                Novo Lote ao lado da Lagoa Municipal — Guaraci · SP
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:white;padding:36px 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                Um novo lead se cadastrou na landing page de lançamento. Confira os dados abaixo e entre em contato o quanto antes.
              </p>

              <!-- Lead info card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
                <tr>
                  <td style="padding:0;">
                    <!-- Name row -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">Nome</p>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#111827;">${name}</p>
                        </td>
                      </tr>
                      <!-- Email row -->
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">E-mail</p>
                          <p style="margin:0;font-size:15px;font-weight:600;color:#1e3a5f;">
                            <a href="mailto:${email}" style="color:#1e3a5f;text-decoration:none;">${email}</a>
                          </p>
                        </td>
                      </tr>
                      <!-- Phone row -->
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">WhatsApp</p>
                          <p style="margin:0;font-size:15px;font-weight:600;color:#1e3a5f;">${phone}</p>
                        </td>
                      </tr>
                      <!-- Date row -->
                      <tr>
                        <td style="padding:14px 20px;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">Data do cadastro</p>
                          <p style="margin:0;font-size:13px;color:#6b7280;">${date}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- WhatsApp CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="${waLink}"
                       style="display:inline-flex;align-items:center;gap:8px;background:#25d366;color:white;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                      Abrir WhatsApp
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                Consmel Imobiliária · Sistema de Lançamento<br />
                <a href="tel:+5517996076414" style="color:#9ca3af;">(17) 99607-6414</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
