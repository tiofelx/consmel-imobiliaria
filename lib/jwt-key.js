import crypto from 'crypto';

const DEV_SECRET_SLOT = '__consmel_dev_jwt_secret';

// Padrões usados em placeholders de configuração. Se o JWT_SECRET bater
// com qualquer um deles, é praticamente certo que o operador esqueceu
// de trocar pelo valor real — recusamos em produção para evitar que
// um atacante com acesso ao código forje JWTs com role: ADMIN.
const WEAK_SECRET_PATTERNS = [
  /change[_\- ]?me/i,
  /placeholder/i,
  /\bexample\b/i,
  /\bdev[_\- ]/i,
  /\btest[_\- ]/i,
  /your[_\- ]?secret/i,
  /replace[_\- ]?this/i,
  /default[_\- ]?secret/i,
  /1234567/,
  /^password/i,
  /^secret$/i,
];

function isWeakSecret(secret) {
  return WEAK_SECRET_PATTERNS.some((pattern) => pattern.test(secret));
}

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
    if (isWeakSecret(envSecret)) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET matches a known placeholder pattern. Generate a new random secret with `openssl rand -base64 64`.');
      }
      console.warn('[SECURITY] JWT_SECRET looks like a placeholder. This will throw in production.');
    }
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
