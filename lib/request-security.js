import { recordSecurityEvent } from './security-events';

const IPV4_WITH_PORT = /^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/;
const IPV4_MAPPED_IPV6 = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/i;
const BRACKETED_IPV6 = /^\[([a-fA-F0-9:]+)\](?::\d+)?$/;
const RAW_IPV6 = /^[a-fA-F0-9:]+$/;

// IPv6: um assinante costuma ter um /64 inteiro; limites e bloqueios valem para o prefixo.
function ipv6Prefix(ip) {
  if (ip === '::1' || !ip.includes(':')) return ip;
  const [head, tail] = ip.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const gap = tail === undefined ? [] : Array(Math.max(0, 8 - left.length - right.length)).fill('0');
  const groups = [...left, ...gap, ...right].slice(0, 4);
  return `${groups.map((group) => (parseInt(group, 16) || 0).toString(16)).join(':')}::/64`;
}

function normalizeIp(value) {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const ipv4Match = trimmed.match(IPV4_WITH_PORT);
  if (ipv4Match) return ipv4Match[1];

  const mappedIpv4Match = trimmed.match(IPV4_MAPPED_IPV6);
  if (mappedIpv4Match) return mappedIpv4Match[1];

  const ipv6BracketMatch = trimmed.match(BRACKETED_IPV6);
  if (ipv6BracketMatch) return ipv6Prefix(ipv6BracketMatch[1]);

  if (RAW_IPV6.test(trimmed)) return ipv6Prefix(trimmed);

  return null;
}

export function getClientIpFromHeaders(headersLike) {
  if (!headersLike || typeof headersLike.get !== 'function') {
    return 'unknown';
  }

  const isBehindTrustedProxy = process.env.VERCEL === '1' || process.env.TRUSTED_PROXY === 'true';

  if (isBehindTrustedProxy) {
    // Só a Vercel sobrescreve este cabeçalho; atrás de outro proxy o cliente o forja.
    const vercelForwarded = process.env.VERCEL === '1' ? headersLike.get('x-vercel-forwarded-for') : null;
    if (vercelForwarded) {
      const normalized = normalizeIp(vercelForwarded.split(',')[0]);
      if (normalized) return normalized;
    }

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

// Anti-CSRF: outro site só envia application/json após preflight CORS, que não liberamos.
// Comparar o tipo exato: "text/plain;application/json" não gera preflight.
export function isJsonRequest(headersLike) {
  const contentType = headersLike?.get?.('content-type') || '';
  return contentType.split(';')[0].trim().toLowerCase() === 'application/json';
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

// IDs são texto: CUID nos registros novos, número convertido nos antigos.
export function parseRecordId(rawId) {
  return typeof rawId === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(rawId) ? rawId : null;
}
