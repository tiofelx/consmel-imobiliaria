import prisma from '@/lib/prisma';
import { addLiveAlert } from './alert-store';
import { safeLogError, sanitizeForLog } from './safe-log';
import { notifyCriticalSecurityEvent } from './security-events';

// Bloqueio temporário: IP pode ser compartilhado (CGNAT) e o contador é abusável.
const BLOCK_TTL_MS = 24 * 60 * 60 * 1000;

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
        addLiveAlert({
            ip,
            reason: `[Bypass Localhost] ${reason}`,
            source,
            severity: 'medium',
            message: `Tentativa detectada no localhost, bloqueio ignorado.`,
            userAgent: metadata.userAgent || 'unknown',
        });
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

        addLiveAlert({
            ip,
            reason,
            source,
            severity: 'critical',
            message: `Tentativa de ataque ou limite excedido. IP bloqueado por 24 horas.`,
            userAgent: metadata.userAgent || 'unknown',
        });

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
