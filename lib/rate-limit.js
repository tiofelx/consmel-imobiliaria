import { LRUCache } from 'lru-cache';

const authCache = new LRUCache({
    max: 500,
    ttl: 3600000
});

export function checkRateLimit(ip) {
    const attempts = authCache.get(ip) || 0;
    return attempts < 30;
}

export function incrementRateLimit(ip) {
    const attempts = authCache.get(ip) || 0;
    authCache.set(ip, attempts + 1);
}

export function resetRateLimit(ip) {
    authCache.delete(ip);
}

export default function rateLimit(options) {
    const tokenCache = new LRUCache({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: options?.interval || 60000,
    });

    return {
        check: (res, limit, token) =>
            new Promise((resolve, reject) => {
                const tokenCount = tokenCache.get(token) || [0];
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount);
                }
                tokenCount[0] += 1;

                const currentUsage = tokenCount[0];
                const isRateLimited = currentUsage >= parseInt(limit, 10);
                res.headers.set('X-RateLimit-Limit', limit);
                res.headers.set(
                    'X-RateLimit-Remaining',
                    isRateLimited ? 0 : limit - currentUsage
                );

                if (isRateLimited) {
                    return reject();
                }

                return resolve();
            }),
    };
}
