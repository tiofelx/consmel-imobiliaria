import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import transporter from '@/lib/mailer';
import rateLimit from '@/lib/rate-limit';
import { getClientIpFromHeaders, logSecurityAttempt } from '@/lib/request-security';

export const dynamic = 'force-dynamic';

const limiter = rateLimit({ uniqueTokenPerInterval: 500, interval: 600000 });

const contactSchema = z.object({
    name: z.string().trim().min(2, 'Nome muito curto').max(100, 'Nome muito longo')
        .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/, 'Nome contém caracteres inválidos'),
    email: z.string().trim().email('E-mail inválido').max(150),
    phone: z.string().trim().min(7, 'Telefone inválido').max(25, 'Telefone muito longo'),
    phone2: z.string().trim().max(25).optional().nullable(),
    message: z.string().trim().max(1000).optional().nullable(),
    propertyTitle: z.string().trim().max(200).optional().nullable(),
    contactViaEmail: z.boolean().optional(),
    contactViaWhatsApp: z.boolean().optional(),
});

export async function POST(request) {
    const ip = getClientIpFromHeaders(request.headers);
    const resForHeaders = new NextResponse();

    try {
        await limiter.check(resForHeaders, 5, `RATE_LIMIT_CONTACT_${ip}`);
    } catch {
        logSecurityAttempt('rate-limit-contact', { ip, route: '/api/contact', reason: 'Contact form flood' });
        return NextResponse.json({ error: 'Muitas requisições. Tente novamente mais tarde.' }, { status: 429 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.errors }, { status: 400 });
    }

    const { name, email, phone, phone2, message, propertyTitle, contactViaEmail, contactViaWhatsApp } = parsed.data;

    // Save to DB
    try {
        await prisma.client.create({
            data: {
                name,
                email,
                phone,
                interest: propertyTitle ? 'Compra' : 'Compra',
                status: 'Novo',
                notes: [
                    propertyTitle ? `Imóvel: ${propertyTitle}` : null,
                    phone2 ? `Contato 2: ${phone2}` : null,
                    message || null,
                ].filter(Boolean).join('\n') || null,
            },
        });
    } catch (err) {
        console.error('Erro ao salvar cliente:', err);
    }

    // Send email notification — fire-and-forget
    notifyContact({ name, email, phone, phone2, message, propertyTitle, contactViaEmail, contactViaWhatsApp }).catch(() => {});

    const response = NextResponse.json({ success: true }, { status: 201 });
    resForHeaders.headers.forEach((v, k) => response.headers.set(k, v));
    return response;
}

async function notifyContact({ name, email, phone, phone2, message, propertyTitle, contactViaEmail, contactViaWhatsApp }) {
    const from = process.env.GMAIL_USER;
    const to = process.env.SECURITY_ALERT_EMAIL_TO;

    if (!from || !to) return;

    const date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const viaList = [
        contactViaEmail ? 'E-mail' : null,
        contactViaWhatsApp ? 'WhatsApp' : null,
    ].filter(Boolean).join(', ') || 'Não informado';

    await transporter.sendMail({
        from: `Consmel Imobiliária <${from}>`,
        to,
        subject: propertyTitle
            ? `Novo contato — Interesse: ${propertyTitle}`
            : 'Novo contato pelo site — Consmel',
        html: buildEmailHtml({ name, email, phone, phone2, message, propertyTitle, viaList, date }),
    });
}

function buildEmailHtml({ name, email, phone, phone2, message, propertyTitle, viaList, date }) {
    const mailtoLink = `mailto:${email}`;
    const waLink = `https://wa.me/55${phone.replace(/\D/g, '')}`;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Novo Contato — Consmel</title>
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
                Consmel Imobiliária
              </p>
              <h1 style="margin:0;color:white;font-size:22px;font-weight:800;line-height:1.3;">
                Novo Contato pelo Site
              </h1>
              ${propertyTitle ? `<p style="margin:8px 0 0;color:#ff9068;font-size:13px;font-weight:600;">Interesse: ${propertyTitle}</p>` : ''}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:white;padding:36px 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                Um visitante preencheu o formulário de contato. Veja os dados abaixo e retorne o quanto antes.
              </p>

              <!-- Info card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
                <tr><td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">Nome</p>
                  <p style="margin:0;font-size:16px;font-weight:700;color:#111827;">${name}</p>
                </td></tr>
                <tr><td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">E-mail</p>
                  <p style="margin:0;font-size:15px;font-weight:600;">
                    <a href="${mailtoLink}" style="color:#1e3a5f;text-decoration:none;">${email}</a>
                  </p>
                </td></tr>
                <tr><td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">Contato 1</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1e3a5f;">${phone}</p>
                </td></tr>
                ${phone2 ? `<tr><td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">Contato 2</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1e3a5f;">${phone2}</p>
                </td></tr>` : ''}
                <tr><td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">Quer retorno via</p>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">${viaList}</p>
                </td></tr>
                ${message ? `<tr><td style="padding:16px 20px;">
                  <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9ca3af;">Mensagem</p>
                  <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${message}</p>
                </td></tr>` : ''}
              </table>

              <!-- CTAs -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${waLink}"
                       style="display:inline-block;background:#25d366;color:white;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                      Responder pelo WhatsApp
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${mailtoLink}"
                       style="display:inline-block;background:#1e3a5f;color:white;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                      Responder por E-mail
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
                Consmel Imobiliária · ${date}
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
