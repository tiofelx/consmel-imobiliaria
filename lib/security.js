import prisma from '@/lib/prisma';
import { detectFraud } from './validations';
import { safeLogError, sanitizeForLog } from './safe-log';
import { notifyCriticalSecurityEvent } from './security-events';

// Bloqueio temporário: IP pode ser compartilhado (CGNAT) e o contador é abusável.
const BLOCK_TTL_MS = 24 * 60 * 60 * 1000;

// Alerta de cadastro suspeito, decidido no servidor. Nunca impede o cadastro.
export async function flagSuspiciousSignup({ name, email, phone, address }, source) {
    try {
        const fraud = detectFraud({ name, email, phone, address });
        if (!fraud.suspicious) return;
        await prisma.alert.create({
            data: {
                type: 'fraud',
                severity: fraud.severity,
                source,
                name: name || null,
                email: email || null,
                phone: phone || null,
                address: address || null,
                reasons: fraud.reasons,
            },
        });
    } catch (error) {
        safeLogError('Error flagging signup', error);
    }
}

export async function checkIpBlocked(ip) {
    if (!ip) return false;

    try {
        const blocked = await prisma.blockedIp.findUnique({
            where: { ip }
        });
        return !!blocked && Date.now() - blocked.createdAt.getTime() < BLOCK_TTL_MS;
    } catch (error) {
        safeLogError('Error checking IP block', error);
        return false;
    }
}

export async function blockIpAndAlert(ip, reason, source = 'system', metadata = {}) {
    // 'unknown' é compartilhado por todos os visitantes sem IP identificado.
    if (!ip || ip === 'unknown') return;

    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
    if (isLocal && process.env.NODE_ENV !== 'production') {
        console.warn(`[SECURITY] Bypass de bloqueio de IP para localhost (dev only): ${reason}`);

        return;
    }

    try {
        // upsert: um bloqueio expirado precisa voltar a valer.
        await prisma.blockedIp.upsert({
            where: { ip },
            create: { ip, reason },
            update: { reason, createdAt: new Date() },
        });
        console.log('[SECURITY] IP %s successfully blocked. Reason:', ip, sanitizeForLog(reason));


        await notifyCriticalSecurityEvent({
            event: 'ip-blocked',
            severity: 'critical',
            route: source,
            ip,
            userAgent: metadata.userAgent || 'unknown',
            reason,
        });

    } catch (error) {
        safeLogError(`[SECURITY] Failed to block IP ${ip}`, error);
    }
}
