import prisma from '@/lib/prisma';
import { addLiveAlert } from '@/lib/alert-store';

const THROTTLE_SLOT = '__consmel_security_notify_throttle';
const THROTTLE_WINDOW_MS = 60_000;

function getThrottleState() {
  if (!globalThis[THROTTLE_SLOT]) {
    globalThis[THROTTLE_SLOT] = new Map();
  }

  return globalThis[THROTTLE_SLOT];
}

function shouldNotify(key) {
  const state = getThrottleState();
  const now = Date.now();
  const lastSeen = state.get(key);

  if (lastSeen && now - lastSeen < THROTTLE_WINDOW_MS) {
    return false;
  }

  state.set(key, now);
  return true;
}

function truncate(value, max = 512) {
  if (value == null) return null;
  const str = String(value);
  return str.length > max ? str.slice(0, max) : str;
}

function formatExternalMessage(payload) {
  return [
    'Critical security event detected',
    `Event: ${payload.event}`,
    `Severity: ${payload.severity}`,
    `Route: ${payload.route || 'unknown'}`,
    `IP: ${payload.ip || 'unknown'}`,
    `User-Agent: ${payload.userAgent || 'unknown'}`,
    `Reason: ${payload.reason || 'unspecified'}`,
    `Time: ${new Date().toISOString()}`,
  ].join('\n');
}

async function notifySlack(payload, message) {
  const webhookUrl = process.env.SECURITY_SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `:rotating_light: ${message}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Critical security event detected*',
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Event*\n${payload.event}` },
            { type: 'mrkdwn', text: `*Severity*\n${payload.severity}` },
            { type: 'mrkdwn', text: `*Route*\n${payload.route || 'unknown'}` },
            { type: 'mrkdwn', text: `*IP*\n${payload.ip || 'unknown'}` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Reason*\n${payload.reason || 'unspecified'}`,
          },
        },
      ],
    }),
  });
}

async function notifyEmail(message) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SECURITY_ALERT_EMAIL_TO;
  const from = process.env.SECURITY_ALERT_EMAIL_FROM || 'security@consmel.local';

  if (!apiKey || !to) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: '[Consmel] Critical security event',
      text: message,
    }),
  });
}

export async function notifyCriticalSecurityEvent(payload) {
  const message = formatExternalMessage(payload);

  try {
    await Promise.allSettled([
      notifySlack(payload, message),
      notifyEmail(message),
    ]);
  } catch {
    // Never break request flow for alert channel failures
  }
}

export async function recordSecurityEvent({
  event,
  severity = 'medium',
  ip = 'unknown',
  userAgent = 'unknown',
  route = 'unknown',
  reason = 'unspecified',
  metadata,
}) {
  const payload = {
    event: truncate(event, 120) || 'unknown',
    severity: truncate(severity, 20) || 'medium',
    ip: truncate(ip, 80) || 'unknown',
    userAgent: truncate(userAgent, 256) || 'unknown',
    route: truncate(route, 200) || 'unknown',
    reason: truncate(reason, 500) || 'unspecified',
  };

  try {
    await prisma.securityEvent.create({
      data: {
        ...payload,
        metadata: metadata ?? null,
      },
    });
  } catch {
    // Avoid failing request path if persistence is unavailable
  }

  if (payload.severity === 'critical') {
    addLiveAlert({
      ip: payload.ip,
      source: payload.route,
      reason: payload.reason,
      severity: payload.severity,
      message: `Evento crítico detectado: ${payload.event}`,
      userAgent: payload.userAgent,
    });

    const throttleKey = `${payload.event}|${payload.ip}|${payload.route}`;
    if (shouldNotify(throttleKey)) {
      await notifyCriticalSecurityEvent(payload);
    }
  }

  return payload;
}
