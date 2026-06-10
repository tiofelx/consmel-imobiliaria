import prisma from '@/lib/prisma';

// ----------------------------------------------------
// Rate limiting persistente (Postgres via Prisma).
//
// Substitui o LRU em memória anterior. Vantagens:
//   - sobrevive a deploy / cold-start (não zera o contador)
//   - global entre instâncias serverless (LRU era por-instância)
//
// Estratégia: janela fixa. `expiresAt` marca o fim da janela; ao expirar,
// o contador reinicia no próximo incremento. Race conditions sob alta
// concorrência são toleráveis (best-effort) — rate limiting não exige
// exatidão transacional.
//
// Fail-open: se o DB estiver indisponível, NÃO bloqueamos o usuário
// (consistente com checkIpBlocked). Preferimos perder proteção temporária
// a derrubar login/cadastro do site inteiro.
// ----------------------------------------------------

const AUTH_WINDOW_MS = 3600000; // 1 hora
const AUTH_MAX = 30;
const AUTH_PREFIX = 'auth:';

async function touch(key, windowMs) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowMs);

    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    // Janela inexistente ou expirada → reinicia em 1.
    if (!existing || existing.expiresAt <= now) {
        await prisma.rateLimit.upsert({
            where: { key },
            create: { key, count: 1, expiresAt },
            update: { count: 1, expiresAt },
        });
        return 1;
    }

    const updated = await prisma.rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
    });
    return updated.count;
}

async function peek(key) {
    const now = new Date();
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row || row.expiresAt <= now) return 0;
    return row.count;
}

// ----------------------------------------------------
// API nomeada — usada por /api/auth/{login,register,2fa/login}
// (assíncrona: os callers usam `await`).
// ----------------------------------------------------

export async function checkRateLimit(ip) {
    try {
        const count = await peek(`${AUTH_PREFIX}${ip}`);
        return count < AUTH_MAX;
    } catch (error) {
        console.error('[rate-limit] checkRateLimit DB error, failing open:', error?.message || error);
        return true; // fail-open
    }
}

export async function incrementRateLimit(ip) {
    try {
        await touch(`${AUTH_PREFIX}${ip}`, AUTH_WINDOW_MS);
    } catch (error) {
        console.error('[rate-limit] incrementRateLimit DB error:', error?.message || error);
    }
}

export async function resetRateLimit(ip) {
    try {
        await prisma.rateLimit.deleteMany({ where: { key: `${AUTH_PREFIX}${ip}` } });
    } catch (error) {
        console.error('[rate-limit] resetRateLimit DB error:', error?.message || error);
    }
}

// ----------------------------------------------------
// API default — usada por /api/{contact,clients,alerts,lancamento-leads}
// Mantém o contrato `.check(res, limit, token)` (Promise resolve/reject)
// e os headers X-RateLimit-*. Agora persistido no DB.
// ----------------------------------------------------

export default function rateLimit(options) {
    const interval = options?.interval || 60000;

    return {
        check: (res, limit, token) =>
            new Promise((resolve, reject) => {
                const max = parseInt(limit, 10);

                touch(`rl:${token}`, interval)
                    .then((count) => {
                        // Semântica original: bloqueia ao atingir `max` (>=).
                        const isLimited = count >= max;
                        res.headers.set('X-RateLimit-Limit', String(max));
                        res.headers.set(
                            'X-RateLimit-Remaining',
                            String(isLimited ? 0 : max - count)
                        );
                        if (isLimited) return reject();
                        return resolve();
                    })
                    .catch((error) => {
                        // Fail-open: erro de DB não derruba o endpoint.
                        console.error('[rate-limit] check DB error, failing open:', error?.message || error);
                        return resolve();
                    });
            }),
    };
}
