import * as OTPAuth from 'otpauth';

/**
 * Generate a random Base32 secret for 2FA.
 */
export function generateSecret(length = 20) {
    let secret = new OTPAuth.Secret({ size: length });
    return secret.base32;
}

/**
 * Generate the standard otpauth URL for QR codes.
 */
export function generateURI({ issuer, label, secret }) {
    let totp = new OTPAuth.TOTP({
        issuer: issuer,
        label: label,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret)
    });
    return totp.toString();
}

/**
 * Manually verifies a token against a secret within a time window.
 */
export async function verifyToken({ token, secret, window = 2 }) {
    if (!token || !secret) return { valid: false };

    try {
        // Clean up inputs (remove spaces, etc)
        const cleanToken = String(token).replace(/\D/g, '');
        const cleanSecret = String(secret).replace(/\W/g, '').toUpperCase();

        let totp = new OTPAuth.TOTP({
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(cleanSecret)
        });

        // The validate function returns the token delta, or null if it is not found
        // in the search window (-window to +window).
        let delta = totp.validate({
            token: cleanToken,
            window: window
        });

        if (delta !== null) {
            return { valid: true };
        }

        return { valid: false };
    } catch (e) {
        console.error("verifyToken error:", e);
        return { valid: false };
    }
}

// Stub mock to maintain exact compatibility with old implementation
export const authenticator = {
    generateSecret: generateSecret
};
