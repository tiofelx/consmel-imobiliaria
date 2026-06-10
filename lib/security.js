import prisma from '@/lib/prisma';
import { addLiveAlert } from './alert-store';
import { safeLogError, sanitizeForLog } from './safe-log';
import { notifyCriticalSecurityEvent } from './security-events';

export async function checkIpBlocked(ip) {
    if (!ip) return false;

    try {
        const blocked = await prisma.blockedIp.findUnique({
            where: { ip }
        });
        return !!blocked;
    } catch (error) {
        safeLogError('Error checking IP block', error);
        return false;
    }
}

export async function blockIpAndAlert(ip, reason, source = 'system', metadata = {}) {
    if (!ip) return;

    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
    if (isLocal && process.env.NODE_ENV !== 'production') {
        console.warn(`[SECURITY] Bypass de bloqueio permanente para localhost (dev only): ${reason}`);
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
        await prisma.$transaction(async (tx) => {
            const existingBlock = await tx.blockedIp.findUnique({
                where: { ip }
            });

            if (!existingBlock) {
                await tx.blockedIp.create({
                    data: {
                        ip,
                        reason
                    }
                });
            }
        });
        console.log(`[SECURITY] IP ${ip} successfully blocked. Reason:`, sanitizeForLog(reason));

        addLiveAlert({
            ip,
            reason,
            source,
            severity: 'critical',
            message: `Tentativa de ataque ou limite excedido. IP permanentemente bloqueado.`,
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
