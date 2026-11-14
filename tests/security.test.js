import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'robotree-test-'));
const TEST_SESSION_SECRET = crypto.randomBytes(32).toString('hex');
process.env.NODE_ENV = 'test';
process.env.ADMIN_PASSCODE = 'TestAdmin!2026';
process.env.SESSION_SECRET = TEST_SESSION_SECRET;
process.env.ROBOTREE_DATA_DIR = dataDir;

const { app, hashPassword, verifyPassword, sanitizeValue } = await import('../server.js');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(dataDir, { recursive: true, force: true });
});

test('sets security headers and returns health status', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.success, true);
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
});

test('rejects mutating requests without CSRF token', async () => {
  const response = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'A', email: 'a@example.com', message: 'Hello' })
  });
  const data = await response.json();

  assert.equal(response.status, 403);
  assert.equal(data.success, false);
});

test('sanitizes contact submissions and stores leads', async () => {
  const result = await postJson('/api/contact', {
    name: 'Ada <script>',
    email: 'ada@example.com',
    phone: '+91 7908932245',
    interest: 'Robotics',
    message: 'Need a lab <script>alert(1)</script>'
  });

  assert.equal(result.success, true);
  const inquiries = readJson('inquiries.json');
  assert.equal(inquiries.length, 1);
  assert.equal(inquiries[0].name.includes('<'), false);
  assert.equal(inquiries[0].message.includes('<script>'), false);
});

test('hashes passwords and supports authenticated login', async () => {
  const passwordHash = hashPassword('StrongPass123');
  assert.match(passwordHash, /^pbkdf2_sha256\$/);
  assert.equal(verifyPassword('StrongPass123', passwordHash).valid, true);
  assert.equal(verifyPassword('WrongPass123', passwordHash).valid, false);
  assert.equal(sanitizeValue('<b>Robotree</b>'), 'bRobotree/b');

  const register = await postJson('/api/auth/register', {
    name: 'Student One',
    email: 'student@example.com',
    password: 'StrongPass123',
    role: 'Student'
  });
  assert.equal(register.success, true);

  const users = readJson('users.json');
  assert.equal(users[0].passwordHash.startsWith('pbkdf2_sha256$'), true);
  assert.notEqual(users[0].passwordHash, 'StrongPass123');

  const login = await postJson('/api/auth/login', {
    email: 'student@example.com',
    password: 'StrongPass123',
    role: 'Student'
  });
  assert.equal(login.success, true);
  assert.equal(login.user.passwordHash, undefined);

  const employeeRegister = await postJson('/api/auth/register', {
    name: 'Employee One',
    email: 'employee@example.com',
    password: 'StrongPass456',
    role: 'Employee'
  });
  assert.equal(employeeRegister.success, true);
  assert.equal(employeeRegister.user.role, 'Employee');

  const wrongRoleLogin = await postJson('/api/auth/login', {
    email: 'employee@example.com',
    password: 'StrongPass456',
    role: 'Student'
  }, 401);
  assert.equal(wrongRoleLogin.success, false);

  const employeeLogin = await postJson('/api/auth/login', {
    email: 'employee@example.com',
    password: 'StrongPass456',
    role: 'Employee'
  });
  assert.equal(employeeLogin.success, true);
  assert.equal(employeeLogin.user.role, 'Employee');
});

function signTestRbt1Token(payload, secret = TEST_SESSION_SECRET) {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `rbt1.${encoded}.${sig}`;
}

test('protects admin dashboard and records failed logins', async () => {
  const denied = await fetch(`${baseUrl}/api/admin/dashboard`);
  assert.equal(denied.status, 401);

  const failedLogin = await postJson('/api/auth/login', {
    email: 'missing@example.com',
    password: 'bad-password'
  }, 401);
  assert.equal(failedLogin.success, false);

  const badAdmin = await postJson('/api/admin/login', { passcode: 'wrong-passcode' }, 401);
  assert.equal(badAdmin.success, false);

  const admin = await postJson('/api/admin/login', { passcode: 'TestAdmin!2026' });
  assert.equal(admin.success, true);

  // Verify structured rbt1.<base64url-payload>.<base64url-hmac> token format and signature
  assert.match(admin.token, /^rbt1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  const parts = admin.token.split('.');
  assert.equal(parts.length, 3);
  const [prefix, encodedPayload, signature] = parts;
  assert.equal(prefix, 'rbt1');

  const expectedSig = crypto
    .createHmac('sha256', TEST_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  assert.equal(signature, expectedSig);

  const decodedPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  assert.equal(decodedPayload.userId, 'admin_root');
  assert.equal(decodedPayload.role, 'SUPER_ADMIN');
  assert.equal(decodedPayload.email, 'admin@robotree.org');
  assert.equal(typeof decodedPayload.jti, 'string');
  assert.equal(decodedPayload.jti.length >= 16, true);
  assert.equal(typeof decodedPayload.iat, 'number');
  assert.equal(typeof decodedPayload.exp, 'number');
  assert.equal(decodedPayload.exp > decodedPayload.iat, true);

  const dashboard = await getJson('/api/admin/dashboard', {
    Authorization: `Bearer ${admin.token}`
  });

  assert.equal(dashboard.success, true);
  assert.equal(dashboard.stats.studentAccounts >= 1, true);
  assert.equal(dashboard.stats.employeeAccounts >= 1, true);
  assert.equal(dashboard.stats.failedLogins >= 2, true);
  assert.equal(dashboard.failedLogins.some((item) => item.status === 'FAILED'), true);
  assert.equal(dashboard.accountActivity.some((item) => item.type === 'ACCOUNT_CREATED'), true);
  assert.equal(dashboard.accountActivity.some((item) => item.type === 'USER_LOGIN'), true);
  assert.equal(dashboard.users.every((user) => user.passwordHash === undefined), true);
});

test('verifies rbt1 token cryptographic integrity, expiration, and admin RBAC', async () => {
  const admin = await postJson('/api/admin/login', { passcode: 'TestAdmin!2026' });
  const [, encodedPayload, signature] = admin.token.split('.');

  // 1. Tampered signature must be rejected (401)
  const flippedChar = signature.endsWith('A') ? 'B' : 'A';
  const tamperedSigToken = `rbt1.${encodedPayload}.${signature.slice(0, -1)}${flippedChar}`;
  const tamperedSigRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${tamperedSigToken}` }
  });
  assert.equal(tamperedSigRes.status, 401);

  // 2. Tampered payload with original signature must be rejected (401)
  const forgedPayload = Buffer.from(
    JSON.stringify({
      jti: 'forged_jti_123456',
      userId: 'admin_root',
      role: 'SUPER_ADMIN',
      email: 'attacker@example.com',
      name: 'Attacker',
      iat: Date.now(),
      exp: Date.now() + 3600_000
    }),
    'utf8'
  ).toString('base64url');
  const tamperedPayloadRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer rbt1.${forgedPayload}.${signature}` }
  });
  assert.equal(tamperedPayloadRes.status, 401);

  // 3. Token signed with wrong secret must be rejected (401)
  const wrongSecretToken = signTestRbt1Token(
    {
      jti: 'wrong_secret_jti',
      userId: 'admin_root',
      role: 'SUPER_ADMIN',
      email: 'admin@robotree.org',
      name: 'System Administrator',
      iat: Date.now(),
      exp: Date.now() + 3600_000
    },
    'different-secret-key-not-valid'
  );
  const wrongSecretRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${wrongSecretToken}` }
  });
  assert.equal(wrongSecretRes.status, 401);

  // 4. Expired rbt1 token must be rejected even with valid signature (401)
  const expiredToken = signTestRbt1Token({
    jti: 'expired_jti_123456',
    userId: 'admin_root',
    role: 'SUPER_ADMIN',
    email: 'admin@robotree.org',
    name: 'System Administrator',
    iat: Date.now() - 60_000,
    exp: Date.now() - 5_000
  });
  const expiredRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${expiredToken}` }
  });
  assert.equal(expiredRes.status, 401);

  // 5. Malformed token must be rejected (401)
  const malformedRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: 'Bearer rbt2.notvalid.token' }
  });
  assert.equal(malformedRes.status, 401);

  // 6. Non-admin (Student) valid rbt1 token must be denied access to admin dashboard (403 Forbidden)
  const studentLogin = await postJson('/api/auth/login', {
    email: 'student@example.com',
    password: 'StrongPass123',
    role: 'Student'
  });
  assert.match(studentLogin.token, /^rbt1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${studentLogin.token}` }
  });
  assert.equal(meRes.status, 200);

  const forbiddenAdminRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${studentLogin.token}` }
  });
  assert.equal(forbiddenAdminRes.status, 403);
});

test('file upload safety: rejects unauthorized upload attempts', async () => {
  const result = await postJson('/api/gallery/upload', {
    imageBase64: Buffer.from('fake data').toString('base64'),
    filename: 'test.jpg'
  }, 401);
  assert.equal(result.success, false);
});

test('file upload safety: rejects disallowed file extensions (.php, .html, .exe)', async () => {
  const result = await postJson('/api/gallery/upload', {
    adminPasscode: 'TestAdmin!2026',
    imageBase64: Buffer.from('<?php echo "evil"; ?>').toString('base64'),
    filename: 'shell.php'
  }, 400);
  assert.equal(result.success, false);
  assert.match(result.message, /Disallowed file type/i);
});

test('file upload safety: rejects spoofed magic bytes', async () => {
  const fakeJpg = Buffer.from('NOT A REAL JPEG IMAGE BUFFER CONTENT AT ALL');
  const result = await postJson('/api/gallery/upload', {
    adminPasscode: 'TestAdmin!2026',
    imageBase64: fakeJpg.toString('base64'),
    filename: 'malicious.jpg'
  }, 400);
  assert.equal(result.success, false);
  assert.match(result.message, /claimed image format/i);
});

test('file upload safety: accepts valid image signature and writes safe unique filename', async () => {
  // Valid JPEG magic bytes: FF D8 FF E0 followed by standard data
  const validJpeg = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60]),
    Buffer.alloc(64, 0x00)
  ]);
  const result = await postJson('/api/gallery/upload', {
    adminPasscode: 'TestAdmin!2026',
    imageBase64: validJpeg.toString('base64'),
    filename: '../../../etc/attempt.jpg'
  }, 200);

  assert.equal(result.success, true);
  assert.ok(result.url);
  assert.match(result.url, /^assets\/gallery\//);
  assert.equal(result.url.includes('..'), false);
});

async function getCsrf() {
  const response = await fetch(`${baseUrl}/api/csrf-token`);
  const data = await response.json();
  const setCookie = response.headers.get('set-cookie') || '';
  return {
    token: data.csrfToken,
    cookie: setCookie.split(';')[0]
  };
}

async function postJson(route, payload, expectedStatus = 200) {
  const csrf = await getCsrf();
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf.token,
      Cookie: csrf.cookie
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  assert.equal(response.status, expectedStatus);
  return data;
}

async function getJson(route, headers = {}) {
  const response = await fetch(`${baseUrl}${route}`, { headers });
  const data = await response.json();
  assert.equal(response.status, 200);
  return data;
}

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, fileName), 'utf8'));
}
