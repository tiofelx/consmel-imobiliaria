import * as OTPAuth from 'otpauth';

export function generateSecret(length = 20) {
    let secret = new OTPAuth.Secret({ size: length });
    return secret.base32;
}

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

export async function verifyToken({ token, secret, window = 2 }) {
    if (!token || !secret) return { valid: false };

    try {
        const cleanToken = String(token).replace(/\D/g, '');
        const cleanSecret = String(secret).replace(/\W/g, '').toUpperCase();

        let totp = new OTPAuth.TOTP({
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(cleanSecret)
        });

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

export const authenticator = {
    generateSecret: generateSecret
};
