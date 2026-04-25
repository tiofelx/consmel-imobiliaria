import { recordSecurityEvent } from './security-events';

const IPV4_WITH_PORT = /^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/;
const IPV4_MAPPED_IPV6 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/i;
const BRACKETED_IPV6 = /^\[([a-fA-F0-9:]+)\](?::\d+)?$/;
const RAW_IPV6 = /^[a-fA-F0-9:]+$/;

function normalizeIp(value) {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const ipv4Match = trimmed.match(IPV4_WITH_PORT);
  if (ipv4Match) return ipv4Match[1];

  const mappedIpv4Match = trimmed.match(IPV4_MAPPED_IPV6);
  if (mappedIpv4Match) return mappedIpv4Match[1];

  const ipv6BracketMatch = trimmed.match(BRACKETED_IPV6);
  if (ipv6BracketMatch) return ipv6BracketMatch[1];

  if (RAW_IPV6.test(trimmed)) return trimmed;

  return null;
}

export function getClientIpFromHeaders(headersLike) {
  if (!headersLike || typeof headersLike.get !== 'function') {
    return 'unknown';
  }

  // x-vercel-forwarded-for é injetado pela edge da Vercel e não pode
  // ser spoofado pelo cliente (Vercel sobrescreve qualquer valor enviado).
  const vercelForwarded = headersLike.get('x-vercel-forwarded-for');
  if (vercelForwarded) {
    const first = vercelForwarded.split(',')[0];
    const normalized = normalizeIp(first);
    if (normalized) return normalized;
  }

  // x-forwarded-for/x-real-ip só são confiáveis quando há um proxy
  // que controla esses headers (Vercel, Cloudflare, etc.). Direto na
  // internet, o cliente pode enviar valores arbitrários — então só
  // confiamos sob `process.env.VERCEL === '1'` ou se TRUSTED_PROXY=true.
  const isBehindTrustedProxy = process.env.VERCEL === '1' || process.env.TRUSTED_PROXY === 'true';

  if (isBehindTrustedProxy) {
    const forwardedFor = headersLike.get('x-forwarded-for');
    if (forwardedFor) {
      const first = forwardedFor.split(',')[0];
      const normalized = normalizeIp(first);
      if (normalized) return normalized;
    }

    const realIp = headersLike.get('x-real-ip');
    if (realIp) {
      const normalized = normalizeIp(realIp);
      if (normalized) return normalized;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return '127.0.0.1';
  }

  return 'unknown';
}

export function getClientUserAgentFromHeaders(headersLike) {
  if (!headersLike || typeof headersLike.get !== 'function') {
    return 'unknown';
  }

  const userAgent = headersLike.get('user-agent');
  if (!userAgent || typeof userAgent !== 'string') {
    return 'unknown';
  }

  return userAgent.slice(0, 256);
}

export function logSecurityAttempt(
  event,
  {
    ip = 'unknown',
    userAgent = 'unknown',
    route = 'unknown',
    reason = 'unspecified',
    severity = 'medium',
    metadata,
  } = {}
) {
  const payload = { event, severity, ip, userAgent, route, reason, metadata };
  console.warn('[SECURITY_ATTEMPT]', payload);

  void recordSecurityEvent(payload).catch((error) => {
    console.warn('[SECURITY_EVENT_PERSISTENCE_FAILED]', error?.message || error);
  });
}

export function parsePositiveIntId(rawId) {
  if (typeof rawId !== 'string' && typeof rawId !== 'number') return null;
  const parsed = Number.parseInt(String(rawId), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}
