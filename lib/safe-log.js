const REDACTED = '[REDACTED]';

const SENSITIVE_KEY_PATTERN = /(password|token|secret|authorization|cookie|session|access_token|refresh_token|id_token|otp|twofactor)/i;

function maskString(value) {
    if (typeof value !== 'string') return value;

    let masked = value;

    // JWT-like values
    masked = masked.replace(/\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, REDACTED);

    // data URLs (ex: QR code base64)
    masked = masked.replace(/data:[^;]+;base64,[A-Za-z0-9+/=]+/g, 'data:[REDACTED_BASE64]');

    // long opaque tokens/keys
    masked = masked.replace(/\b[A-Za-z0-9+/=_-]{24,}\b/g, REDACTED);

    return masked;
}

function sanitize(value, depth = 0) {
    if (depth > 5) return '[TRUNCATED]';

    if (value == null) return value;

    if (typeof value === 'string') return maskString(value);
    if (typeof value === 'number' || typeof value === 'boolean') return value;

    if (Array.isArray(value)) {
        return value.map((item) => sanitize(item, depth + 1));
    }

    if (typeof value === 'object') {
        const out = {};
        for (const [key, val] of Object.entries(value)) {
            if (SENSITIVE_KEY_PATTERN.test(key)) {
                out[key] = REDACTED;
            } else {
                out[key] = sanitize(val, depth + 1);
            }
        }
        return out;
    }

    return String(value);
}

export function safeLogError(context, error, metadata = undefined) {
    const base = {
        name: error?.name,
        message: maskString(error?.message || String(error)),
        code: error?.code,
    };

    const payload = metadata ? sanitize(metadata) : undefined;

    if (payload) {
        console.error(context, base, payload);
        return;
    }

    console.error(context, base);
}

export function sanitizeForLog(value) {
    return sanitize(value);
}
