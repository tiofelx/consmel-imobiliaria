import prisma from '@/lib/prisma';
import { addLiveAlert } from './alert-store';
import { safeLogError, sanitizeForLog } from './safe-log';
import { notifyCriticalSecurityEvent } from './security-events';

/**
 * Checks if an IP is blocked in the database.
 * @param {string} ip The IP address to check.
 * @returns {Promise<boolean>} True if blocked, false otherwise.
 */
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

/**
 * Blocks an IP permanently and generates a high severity alert for administrators.
 * @param {string} ip The IP address to block.
 * @param {string} reason The reason for the block.
 * @param {string} source The source of the block (e.g., 'login', 'register').
 */
export async function blockIpAndAlert(ip, reason, source = 'system', metadata = {}) {
    if (!ip) return;

    // Whitelist localhost for development testing
    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1') || ip === 'localhost';
    if (isLocal) {
        console.warn(`[SECURITY] Bypass de bloqueio permanente para localhost: ${reason}`);
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
            // Check if already blocked to avoid unique constraint errors
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

        // Dispatch to real-time admin alert system instead of DB
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
