const BASE_URL = process.env.SECURITY_BASE_URL || 'http://127.0.0.1:3000';

async function runCase({ name, path, method = 'GET', body, expectedStatus }) {
  try {
    const requestHeaders = {
      'User-Agent': 'consmel-security-smoke/1.0',
      'X-Forwarded-For': '127.0.0.1',
    };

    if (body) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
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
  console.log(`Running defensive security smoke tests against ${BASE_URL}`);

  const cases = [
    {
      name: 'Block malformed client ID',
      path: '/api/clients/not-a-number',
      method: 'GET',
      expectedStatus: 403,
    },
    {
      name: 'Block malformed alert ID',
      path: '/api/alerts/not-a-number',
      method: 'PUT',
      body: { resolved: true },
      expectedStatus: 403,
    },
    {
      name: 'Reject XSS-like name on register',
      path: '/api/auth/register',
      method: 'POST',
      body: {
        name: "<script>alert('x')</script>",
        email: 'defensive.test@gmail.com',
        password: 'StrongPassword123',
      },
      expectedStatus: 400,
    },
    {
      name: 'Reject SQLi-like login email',
      path: '/api/auth/login',
      method: 'POST',
      body: {
        email: "admin@consmel.com' OR 1=1 --",
        password: 'StrongPassword123',
      },
      expectedStatus: 403,
    },
  ];

  let passed = 0;
  for (const testCase of cases) {
    const ok = await runCase(testCase);
    if (ok) passed += 1;
  }

  const total = cases.length;
  const failed = total - passed;
  console.log(`\nSecurity smoke summary: ${passed}/${total} passed, ${failed} failed.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
