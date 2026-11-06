import fs from 'fs';
import os from 'os';
import path from 'path';

const tempDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'robotree-production-verify-'));

process.env.NODE_ENV = 'production';
process.env.ADMIN_PASSCODE ||= 'ProductionVerifyAdminPasscode!2026';
process.env.SESSION_SECRET ||= 'production-verification-secret-that-is-long-enough-for-hmac-signing';
process.env.ROBOTREE_DATA_DIR = tempDataDir;
process.env.ALLOWED_ORIGINS ||= 'https://robotree.org,https://www.robotree.org';

const { app } = await import('../server.js');

const checks = [];
let server;
let baseUrl;

try {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });

  await checkHealthAndHeaders();
  await checkCsrfGuard();
  await checkValidation();
  await checkStaticCaching();

  for (const check of checks) {
    console.log(`[PASS] ${check}`);
  }
  console.log(`[SUCCESS] Production smoke verification completed with ${checks.length} checks.`);
} catch (error) {
  console.error(`[FAIL] ${error.message}`);
  process.exitCode = 1;
} finally {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  fs.rmSync(tempDataDir, { recursive: true, force: true });
}

async function checkHealthAndHeaders() {
  const response = await fetch(`${baseUrl}/api/health`);
  const data = await response.json();

  assert(response.status === 200, 'Health check must return HTTP 200.');
  assert(data.success === true && data.status === 'ok', 'Health response must report ok status.');
  assert(response.headers.get('x-content-type-options') === 'nosniff', 'Missing nosniff header.');
  assert(response.headers.get('x-frame-options') === 'DENY', 'Missing frame deny header.');
  assert((response.headers.get('content-security-policy') || '').includes("default-src 'self'"), 'Missing restrictive CSP.');
  assert((response.headers.get('strict-transport-security') || '').includes('max-age=63072000'), 'Missing HSTS in production mode.');

  checks.push('health endpoint and core security headers');
}

async function checkCsrfGuard() {
  const response = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Verification User',
      email: 'verify@example.com',
      message: 'This request intentionally omits CSRF.'
    })
  });

  assert(response.status === 403, 'Mutating request without CSRF must be rejected.');
  checks.push('CSRF rejection for mutating requests');
}

async function checkValidation() {
  const csrf = await getCsrf();
  const response = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf.token,
      Cookie: csrf.cookie
    },
    body: JSON.stringify({
      name: 'Verification User',
      email: 'not-an-email',
      message: 'This should fail validation.'
    })
  });

  assert(response.status === 400, 'Invalid email must fail validation.');
  checks.push('input validation rejection');
}

async function checkStaticCaching() {
  const response = await fetch(`${baseUrl}/assets/robotree_logo.png`);
  const cacheControl = response.headers.get('cache-control') || '';

  assert(response.status === 200, 'Static asset must be served.');
  assert(cacheControl.includes('max-age=31536000'), 'Static asset must include long-lived cache control.');
  assert(cacheControl.includes('immutable'), 'Static asset must be immutable in production mode.');
  checks.push('static asset CDN/browser cache headers');
}

async function getCsrf() {
  const response = await fetch(`${baseUrl}/api/csrf-token`);
  const data = await response.json();
  const cookie = (response.headers.get('set-cookie') || '').split(';')[0];
  return { token: data.csrfToken, cookie };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
