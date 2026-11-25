import crypto from 'crypto';
import prisma from '@/lib/prisma';
import transporter from '@/lib/mailer';
import { createSession } from '@/lib/auth';
import { getJwtSecret } from '@/lib/jwt-key';
import { consumeAttempt } from '@/lib/rate-limit';
import { safeLogError } from '@/lib/safe-log';

// Verificação de e-mail por código de 6 dígitos.
// O pedido fica num cookie assinado no navegador que o iniciou e o código vai para
// a caixa de entrada: só confirma quem tem os dois. Nada é gravado antes disso.
// O cookie é legível pelo dono, por isso leva só o HMAC (com segredo) do código.

const MAX_MAILS_PER_HOUR = 5;

const codeMac = (email, code) =>
    crypto.createHmac('sha256', getJwtSecret()).update(`email-code:${email}:${code}`).digest('hex');

export function codeMatches(pending, code) {
    const expected = Buffer.from(codeMac(pending.email, code));
    const received = Buffer.from(String(pending.codeMac));
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

/**
 * `pending`: { email, via: 'register' | 'google' | 'password', name?, phone?, passwordHash? }
 * `accountExists`: manda só um aviso (o código não é enviado), para o cadastro
 * responder igual e não revelar quais e-mails têm conta.
 * Retorna {} em caso de sucesso ou { error, status }.
 */
export async function startEmailVerification(pending, { accountExists = false } = {}) {
    if (!(await consumeAttempt(`mail:${pending.email.toLowerCase()}`, MAX_MAILS_PER_HOUR))) {
        return { error: 'Muitos códigos enviados para este e-mail. Tente novamente em 1 hora.', status: 429 };
    }

    const code = String(crypto.randomInt(1000000)).padStart(6, '0');

    try {
        await transporter.sendMail({
            from: `Consmel Imobiliária <${process.env.GMAIL_USER}>`,
            to: pending.email,
            subject: accountExists ? 'Você já tem uma conta na Consmel' : 'Seu código de verificação — Consmel',
            text: accountExists
                ? 'Recebemos um pedido de cadastro com este e-mail, mas ele já tem uma conta. Entre com sua senha ou com o Google. Se não foi você, ignore esta mensagem.'
                : `Seu código de verificação é ${code}. Ele vale por 15 minutos.\n\nDigite-o somente na tela que você mesmo abriu. Se não foi você, ignore esta mensagem e não compartilhe o código.`,
        });
    } catch (error) {
        safeLogError('Verification email error', error);
        return { error: 'Não foi possível enviar o código por e-mail. Tente novamente.', status: 503 };
    }

    await createSession(
        { ...pending, stage: 'email_pending', codeMac: codeMac(pending.email, code) },
        '15m',
        'pending_email'
    );
    return {};
}

const userSelect = { id: true, email: true, name: true, role: true, twoFactorEnabled: true, emailVerified: true };

/** Aplica o pedido já confirmado. Retorna o usuário, ou null se não puder aplicar. */
export async function confirmAccount({ email, via, name, phone, passwordHash }) {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { email }, select: userSelect });

        if (existing?.emailVerified) {
            return via === 'register' ? null : existing;
        }

        const emailVerified = new Date();

        if (existing) {
            const data = { emailVerified };
            if (via === 'register') Object.assign(data, { name, phone, password: passwordHash });
            // Senha definida antes de qualquer verificação pode ser de terceiro (pré-sequestro).
            if (via === 'google' && existing.role !== 'ADMIN') data.password = '';
            return tx.user.update({ where: { id: existing.id }, data, select: userSelect });
        }

        if (via === 'password') return null;

        const user = await tx.user.create({
            data: { name, email, phone, password: passwordHash || '', role: 'CLIENT', emailVerified },
            select: userSelect,
        });

        if (!(await tx.client.findFirst({ where: { email } }))) {
            await tx.client.create({ data: { name, email, phone, interest: 'Compra', status: 'Novo' } });
        }

        return user;
    });
}
