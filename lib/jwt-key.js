import crypto from 'crypto';

const DEV_SECRET_SLOT = '__consmel_dev_jwt_secret';

function getOrCreateDevSecret() {
  const globalState = globalThis;

  if (!globalState[DEV_SECRET_SLOT]) {
    globalState[DEV_SECRET_SLOT] = crypto.randomBytes(48).toString('hex');
    console.warn('[SECURITY] JWT_SECRET not set. Using ephemeral dev secret.');
  }

  return globalState[DEV_SECRET_SLOT];
}

export function getJwtSecret() {
  const envSecret = process.env.JWT_SECRET;

  if (envSecret && envSecret.trim().length >= 32) {
    return envSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production and must be at least 32 characters long.');
  }

  return getOrCreateDevSecret();
}

export function getJwtKey() {
  return new TextEncoder().encode(getJwtSecret());
}
