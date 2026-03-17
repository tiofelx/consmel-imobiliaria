const BASE_URL = process.env.SECURITY_BASE_URL || 'http://127.0.0.1:3000';
const ADMIN_EMAIL = process.env.SECURITY_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SECURITY_ADMIN_PASSWORD;
const ADMIN_2FA_TOKEN = process.env.SECURITY_ADMIN_2FA_TOKEN;

function parseSessionCookie(setCookieHeader) {
  if (!setCookieHeader) return null;

  const cookiePart = setCookieHeader
    .split(',')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith('session='));

  if (!cookiePart) return null;
  return cookiePart.split(';')[0];
}

async function loginAndGetSessionCookie() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('SECURITY_ADMIN_EMAIL and SECURITY_ADMIN_PASSWORD are required for authenticated smoke tests.');
  }

  const payload = {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  };

  if (ADMIN_2FA_TOKEN) {
    payload.token = ADMIN_2FA_TOKEN;
  }

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'consmel-security-smoke-auth/1.0',
      'X-Forwarded-For': '127.0.0.1',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Admin login failed with status ${response.status}. Body: ${body}`);
  }

  const body = await response.json();
  if (body.require2fa && !ADMIN_2FA_TOKEN) {
    throw new Error('Admin account requires 2FA. Provide SECURITY_ADMIN_2FA_TOKEN to run authenticated smoke tests.');
  }

  const cookie = parseSessionCookie(response.headers.get('set-cookie'));
  if (!cookie) {
    throw new Error('Session cookie was not returned by login endpoint.');
  }

  return cookie;
}

async function runCase({ name, path, expectedStatus }, cookie) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Cookie: cookie,
        'User-Agent': 'consmel-security-smoke-auth/1.0',
        'X-Forwarded-For': '127.0.0.1',
      },
    });

    const ok = response.status === expectedStatus;
    const result = ok ? 'PASS' : 'FAIL';
    console.log(`[${result}] ${name} -> status ${response.status} (expected ${expectedStatus})`);
    return ok;
  } catch (error) {
    console.log(`[FAIL] ${name} -> request error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`Running authenticated defensive smoke tests against ${BASE_URL}`);

  let cookie;
  try {
    cookie = await loginAndGetSessionCookie();
    console.log('[PASS] Admin login and session acquisition');
  } catch (error) {
    console.log(`[FAIL] Admin login and session acquisition -> ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const cases = [
    {
      name: 'Admin can access dashboard stats',
      path: '/api/stats',
      expectedStatus: 200,
    },
    {
      name: 'Admin can access live alerts feed',
      path: '/api/admin/alerts/live',
      expectedStatus: 200,
    },
    {
      name: 'Admin can list clients',
      path: '/api/clients',
      expectedStatus: 200,
    },
    {
      name: 'Admin can list events',
      path: '/api/events',
      expectedStatus: 200,
    },
    {
      name: 'Admin can list security events',
      path: '/api/security-events?page=1&pageSize=5',
      expectedStatus: 200,
    },
  ];

  let passed = 0;
  for (const testCase of cases) {
    const ok = await runCase(testCase, cookie);
    if (ok) passed += 1;
  }

  const total = cases.length;
  const failed = total - passed;
  console.log(`\nAuthenticated smoke summary: ${passed}/${total} passed, ${failed} failed.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
