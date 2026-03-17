import crypto from 'crypto';

function resolveEncryptionKey() {
    const envKey = process.env.ENCRYPTION_KEY;
    if (envKey) {
        const normalized = envKey.trim();
        if (!/^[a-fA-F0-9]{64}$/.test(normalized)) {
            throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
        }
        return Buffer.from(normalized, 'hex');
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY is required in production.');
    }

    return crypto.createHash('sha256').update('consmel-dev-encryption-key').digest();
}

const ENCRYPTION_KEY = resolveEncryptionKey();

const IV_LENGTH = 16; // AES block size

export function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + authTag.toString('hex');
}

export function decrypt(text) {
    if (!text) return null;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.shift(), 'hex');
        const authTag = Buffer.from(textParts.shift(), 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        console.error('Decryption failed:', error);
        return null; // Fail safe
    }
}
