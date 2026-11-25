import prisma from '@/lib/prisma';

// ----------------------------------------------------
// Rate limiting persistente (Postgres via Prisma).
//
// Substitui o LRU em memória anterior. Vantagens:
//   - sobrevive a deploy / cold-start (não zera o contador)
//   - global entre instâncias serverless (LRU era por-instância)
//
// Estratégia: janela fixa. `expiresAt` marca o fim da janela; ao expirar,
// o contador reinicia no próximo incremento. A contagem é um único comando SQL
// (atômico): tentativas em paralelo não passam do limite.
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

    const [row] = await prisma.$queryRaw`
        INSERT INTO "rate_limits" ("key", "count", "expiresAt") VALUES (${key}, 1, ${expiresAt})
        ON CONFLICT ("key") DO UPDATE SET
            "count" = CASE WHEN "rate_limits"."expiresAt" <= ${now} THEN 1 ELSE "rate_limits"."count" + 1 END,
            "expiresAt" = CASE WHEN "rate_limits"."expiresAt" <= ${now} THEN ${expiresAt} ELSE "rate_limits"."expiresAt" END
        RETURNING "count"`;
    return Number(row.count);
}

// ----------------------------------------------------
// API nomeada — usada pelas rotas de autenticação.
// `key` é o IP, `acct:<email>` etc. Conta a tentativa ANTES de validar
// credenciais; em caso de sucesso o chamador usa resetRateLimit.
// ----------------------------------------------------

export async function consumeAttempt(key, max = AUTH_MAX) {
    try {
        return (await touch(`${AUTH_PREFIX}${key}`, AUTH_WINDOW_MS)) <= max;
    } catch (error) {
        console.error('[rate-limit] consumeAttempt DB error, failing open:', error?.message || error);
        return true; // fail-open
    }
}

export async function resetRateLimit(key) {
    try {
        await prisma.rateLimit.deleteMany({ where: { key: `${AUTH_PREFIX}${key}` } });
    } catch (error) {
        console.error('[rate-limit] resetRateLimit DB error:', error?.message || error);
    }
}

// Por conta: apertado para cada IP e folgado no total. Um IP sozinho não trava o dono;
// força bruta distribuída ainda para no teto.
const ACCOUNT_IP_MAX = 10;
const ACCOUNT_MAX = 100;
const accountKey = (email) => `acct:${email.toLowerCase()}`;

export async function consumeAccountAttempt(email, ip) {
    const key = accountKey(email);
    // Recusado no par conta+IP não conta no total. 'unknown' é compartilhado: só o total.
    if (ip !== 'unknown' && !(await consumeAttempt(`${key}:${ip}`, ACCOUNT_IP_MAX))) return false;
    return consumeAttempt(key, ACCOUNT_MAX);
}

export async function resetAccountAttempts(email, ip) {
    await resetRateLimit(`${accountKey(email)}:${ip}`);
    await resetRateLimit(accountKey(email));
}

// Código TOTP aceito vale uma vez só (a janela de 1 h cobre os ~90 s de validade).
export function consumeTotpCode(userId, token) {
    return consumeAttempt(`totp:${userId}:${String(token).replace(/\D/g, '')}`, 1);
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
