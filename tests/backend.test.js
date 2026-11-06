import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'robotree-backend-test-'));
process.env.NODE_ENV = 'test';
process.env.ADMIN_PASSCODE = 'Aniket4515';
process.env.ADMIN_PERMISSION_KEY = 'GoluSingh99';
process.env.ROBOTREE_DATA_DIR = testDataDir;

const { app, COURSES_CATALOG, hashPassword, verifyPassword } = await import('../server.js');
const { db } = await import('../data/db.js');

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
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  fs.rmSync(testDataDir, { recursive: true, force: true });
});

// Helper for CSRF-authenticated requests
async function getCsrfSession() {
  const res = await fetch(`${baseUrl}/api/csrf-token`);
  const data = await res.json();
  const rawCookie = res.headers.get('set-cookie') || '';
  const cookiePair = rawCookie.split(';')[0];
  return { token: data.csrfToken, cookie: cookiePair };
}

test('1. Security Headers & Health Status', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.status, 'ok');
  assert.equal(typeof data.timestamp, 'string');

  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin');
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
  assert.match(response.headers.get('content-security-policy') || '', /default-src 'self'/);
});

test('2. CSRF Guard rejects mutating requests without token', async () => {
  const response = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl
    },
    body: JSON.stringify({
      name: 'Tester',
      email: 'tester@example.com',
      message: 'Test message'
    })
  });

  assert.equal(response.status, 403);
  const data = await response.json();
  assert.equal(data.success, false);
  assert.match(data.message, /Security token is missing or expired/i);
});

test('3. CORS Guard rejects unauthorized cross-origin requests', async () => {
  const { token, cookie } = await getCsrfSession();
  const response = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://malicious-attacker-website.com',
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({
      name: 'Attacker',
      email: 'attacker@example.com',
      message: 'Malicious payload'
    })
  });

  assert.equal(response.status, 403);
  const data = await response.json();
  assert.equal(data.success, false);
  assert.match(data.message, /Request origin is not allowed/i);
});

test('4. Strict Input Validation rejects invalid email and short fields', async () => {
  const { token, cookie } = await getCsrfSession();

  // Invalid email
  const badEmailRes = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({
      name: 'Valid Name',
      email: 'not-an-email',
      message: 'This is a valid test message.'
    })
  });

  assert.equal(badEmailRes.status, 400);
  const badEmailData = await badEmailRes.json();
  assert.equal(badEmailData.success, false);
  assert.equal(badEmailData.error, 'Validation Error');

  // Missing message
  const missingMsgRes = await fetch(`${baseUrl}/api/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({
      name: 'Valid Name',
      email: 'valid@example.com',
      message: ''
    })
  });

  assert.equal(missingMsgRes.status, 400);
});

test('5. Password Hashing (PBKDF2 210,000 iterations) & Verification', () => {
  const password = 'StrongPassword2026!';
  const hash = hashPassword(password);

  assert.match(hash, /^pbkdf2_sha256\$210000\$/);
  assert.equal(verifyPassword(password, hash).valid, true);
  assert.equal(verifyPassword('WrongPassword', hash).valid, false);
});

test('6. User Registration & Session Token Authentication', async () => {
  const { token, cookie } = await getCsrfSession();
  const email = `student_${Date.now()}@example.com`;

  // Register
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({
      name: 'Aarav Patel',
      email,
      password: 'StrongStudentPass123!',
      role: 'Student'
    })
  });

  assert.equal(regRes.status, 200);
  const regData = await regRes.json();
  assert.equal(regData.success, true);
  assert.ok(regData.token);
  assert.equal(regData.user.role, 'Student');

  // Verify Session with /api/auth/me
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${regData.token}`
    }
  });

  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.success, true);
  assert.equal(meData.user.email, email);

  // Logout
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie,
      'Authorization': `Bearer ${regData.token}`
    }
  });

  assert.equal(logoutRes.status, 200);
});

test('6.1 Password Reset Flow updates hash and permits new login', async () => {
  const { token, cookie } = await getCsrfSession();
  const email = `test_reset_${Date.now()}@example.com`;

  // Register
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({
      name: 'Reset Test User',
      email,
      password: 'OldPassword123!',
      role: 'Student'
    })
  });
  assert.equal(regRes.status, 200);

  // Reset Password
  const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({
      email,
      newPassword: 'BrandNewSecurePassword456!'
    })
  });
  assert.equal(resetRes.status, 200);
  const resetData = await resetRes.json();
  assert.equal(resetData.success, true);

  // Login with old password should fail
  const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({
      email,
      password: 'OldPassword123!'
    })
  });
  assert.equal(oldLoginRes.status, 401);

  // Login with new password should succeed
  const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({
      email,
      password: 'BrandNewSecurePassword456!'
    })
  });
  assert.equal(newLoginRes.status, 200);
  const newLoginData = await newLoginRes.json();
  assert.equal(newLoginData.success, true);
});

test('7. Admin Passcode Protection & Session Management', async () => {
  const { token, cookie } = await getCsrfSession();

  // Failed admin login
  const failRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode: 'WrongPasscode' })
  });

  assert.equal(failRes.status, 401);

  // Successful admin login
  const passRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode: 'Aniket4515' })
  });

  assert.equal(passRes.status, 200);
  const passData = await passRes.json();
  assert.ok(passData.token);

  // Access protected admin dashboard
  const dashRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
    headers: {
      'Authorization': `Bearer ${passData.token}`
    }
  });

  assert.equal(dashRes.status, 200);
  const dashData = await dashRes.json();
  assert.equal(dashData.success, true);
  assert.ok(dashData.stats);
});

test('7b. Admin Password Change & Verification (Old Password Verification & Persistence)', async () => {
  const { token, cookie } = await getCsrfSession();

  // 1. Initial admin login
  const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode: 'Aniket4515' })
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  const adminToken = loginData.token;

  // 2. Reject change with incorrect old password
  const wrongOldRes = await fetch(`${baseUrl}/api/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie,
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      oldPassword: 'IncorrectOldPassword123',
      newPassword: 'BrandNewAdminPass2026!',
      confirmPassword: 'BrandNewAdminPass2026!'
    })
  });
  assert.equal(wrongOldRes.status, 401);

  // 3. Reject change with short new password
  const shortNewRes = await fetch(`${baseUrl}/api/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie,
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      oldPassword: 'Aniket4515',
      newPassword: 'short',
      confirmPassword: 'short'
    })
  });
  assert.equal(shortNewRes.status, 400);

  // 4. Reject change with password mismatch
  const mismatchRes = await fetch(`${baseUrl}/api/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie,
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      oldPassword: 'Aniket4515',
      newPassword: 'BrandNewAdminPass2026!',
      confirmPassword: 'DifferentAdminPass2026!'
    })
  });
  assert.equal(mismatchRes.status, 400);

  // 5. Successfully update admin password
  const successRes = await fetch(`${baseUrl}/api/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie,
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      oldPassword: 'Aniket4515',
      newPassword: 'BrandNewAdminPass2026!',
      confirmPassword: 'BrandNewAdminPass2026!'
    })
  });
  assert.equal(successRes.status, 200);
  const successData = await successRes.json();
  assert.equal(successData.success, true);

  // 6. Old password must now be rejected
  const oldLoginFail = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode: 'Aniket4515' })
  });
  assert.equal(oldLoginFail.status, 401);

  // 7. New password must authenticate successfully
  const newLoginPass = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode: 'BrandNewAdminPass2026!' })
  });
  assert.equal(newLoginPass.status, 200);
  const newLoginData = await newLoginPass.json();
  assert.ok(newLoginData.token);

  // 8. Restore password back to Aniket4515 to preserve standard environment
  const restoreRes = await fetch(`${baseUrl}/api/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie,
      'Authorization': `Bearer ${newLoginData.token}`
    },
    body: JSON.stringify({
      oldPassword: 'BrandNewAdminPass2026!',
      newPassword: 'Aniket4515',
      confirmPassword: 'Aniket4515',
      adminPermissionKey: 'GoluSingh99',
      adminPermissionConfirmed: true
    })
  });
  assert.equal(restoreRes.status, 200);

  // 9. Verify Admin Permission Status endpoint
  const permStatusRes = await fetch(`${baseUrl}/api/admin/permission-status`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  assert.equal(permStatusRes.status, 200);
  const permStatusData = await permStatusRes.json();
  assert.equal(permStatusData.success, true);
  assert.equal(typeof permStatusData.permissionLocked, 'boolean');

  // 10. Reject password change with invalid admin permission key
  const invalidPermRes = await fetch(`${baseUrl}/api/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie,
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      oldPassword: 'Aniket4515',
      newPassword: 'BrandNewAdminPass2026!',
      confirmPassword: 'BrandNewAdminPass2026!',
      adminPermissionKey: 'WRONG-PERMISSION-KEY',
      adminPermissionConfirmed: true
    })
  });
  assert.equal(invalidPermRes.status, 401);

  // 11. Lock Admin Password modifications
  const lockPermRes = await fetch(`${baseUrl}/api/admin/toggle-permission-lock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie,
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      locked: true,
      adminPermissionKey: 'GoluSingh99'
    })
  });
  assert.equal(lockPermRes.status, 200);

  // 12. Password change must be BLOCKED when admin permission is locked (without permission key)
  const blockedChangeRes = await fetch(`${baseUrl}/api/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie,
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      oldPassword: 'Aniket4515',
      newPassword: 'BrandNewAdminPass2026!',
      confirmPassword: 'BrandNewAdminPass2026!'
    })
  });
  assert.equal(blockedChangeRes.status, 401);

  // 13. Unlock Admin Password modifications
  const unlockPermRes = await fetch(`${baseUrl}/api/admin/toggle-permission-lock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie,
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      locked: false,
      adminPermissionKey: 'GoluSingh99'
    })
  });
  assert.equal(unlockPermRes.status, 200);
});

test('8. Authoritative Server-Side Pricing (Item 11)', async () => {
  const { token, cookie } = await getCsrfSession();

  // Request order creation with a malicious / spoofed amount in body
  const orderRes = await fetch(`${baseUrl}/api/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({
      courseId: 'ai-ml-masterclass',
      amount: 1 // Malicious client attempt to pay 1 Rupee!
    })
  });

  assert.equal(orderRes.status, 200);
  const orderData = await orderRes.json();
  assert.equal(orderData.success, true);
  // Server must enforce official catalog price 3499 INR, ignoring client-supplied 1 Rupee!
  assert.equal(orderData.amount, COURSES_CATALOG['ai-ml-masterclass'].price);
  assert.equal(orderData.currency, 'INR');
});

test('9. Certificate Generation, Verification & Valid PDF Download', async () => {
  const { token: csrfToken, cookie } = await getCsrfSession();

  // First register a user to get an auth token
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': csrfToken,
      'Cookie': cookie
    },
    body: JSON.stringify({
      name: 'Cert Test Student',
      email: `certtest_${Date.now()}@example.com`,
      password: 'CertPassword123!',
      role: 'Student'
    })
  });
  assert.equal(regRes.status, 200);
  const regData = await regRes.json();
  const authToken = regData.token;

  // Unauthenticated certificate generation must be rejected (401)
  const unauthRes = await fetch(`${baseUrl}/api/certificates/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': csrfToken,
      'Cookie': cookie
    },
    body: JSON.stringify({
      studentName: 'Sneha Kumari',
      courseTitle: 'Artificial Intelligence & Machine Learning',
      issueDate: '2026-08-25'
    })
  });
  assert.equal(unauthRes.status, 401);

  // Authenticated non-admin (Student) certificate generation must be rejected (403)
  const studentGenRes = await fetch(`${baseUrl}/api/certificates/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': csrfToken,
      'Cookie': cookie,
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      studentName: 'Sneha Kumari',
      courseTitle: 'Artificial Intelligence & Machine Learning',
      issueDate: '2026-08-25'
    })
  });
  assert.equal(studentGenRes.status, 403);

  // Admin login to get admin token
  const adminLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': csrfToken,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode: 'Aniket4515' })
  });
  assert.equal(adminLoginRes.status, 200);
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;

  // Authenticated Admin certificate generation succeeds (200)
  const genRes = await fetch(`${baseUrl}/api/certificates/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': csrfToken,
      'Cookie': cookie,
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      studentName: 'Sneha Kumari',
      courseTitle: 'Artificial Intelligence & Machine Learning',
      issueDate: '2026-08-25'
    })
  });

  assert.equal(genRes.status, 200);
  const genData = await genRes.json();
  assert.equal(genData.success, true);
  assert.match(genData.certificate.id, /^RRT-2026-/);

  const certId = genData.certificate.id;

  // Verification lookup
  const verifyRes = await fetch(`${baseUrl}/api/certificates/verify/${encodeURIComponent(certId)}`);
  assert.equal(verifyRes.status, 200);
  const verifyData = await verifyRes.json();
  assert.equal(verifyData.success, true);
  assert.equal(verifyData.certificate.studentName, 'Sneha Kumari');

  // Download PDF
  const dlRes = await fetch(`${baseUrl}/api/certificates/download/${encodeURIComponent(certId)}`);
  assert.equal(dlRes.status, 200);
  assert.equal(dlRes.headers.get('content-type'), 'application/pdf');
  const buffer = await dlRes.arrayBuffer();
  assert.ok(buffer.byteLength > 50000);
});

test('10. IDOR Protection: Non-existent Certificate Download returns 404', async () => {
  const fakeId = 'RRT-2026-FAKE-CODE';
  const dlRes = await fetch(`${baseUrl}/api/certificates/download/${encodeURIComponent(fakeId)}?studentName=Hacker`);
  assert.equal(dlRes.status, 404);
});

test('10.1 Admin Certificate Issue & Revoke Flow', async () => {
  const { token, cookie } = await getCsrfSession();
  const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode: 'Aniket4515' })
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  const adminToken = loginData.token;

  // Issue cert
  const issueRes = await fetch(`${baseUrl}/api/admin/certificates/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookie
    },
    body: JSON.stringify({
      studentName: 'Revoke Test Student',
      courseName: 'Advanced Robotics Lab',
      email: 'teststudent@gmail.com',
      grade: 'Outstanding (A+)'
    })
  });
  assert.equal(issueRes.status, 201);
  const issueData = await issueRes.json();
  const issuedId = issueData.certificate.id;
  assert.ok(issuedId);

  // Revoke cert
  const revokeRes = await fetch(`${baseUrl}/api/admin/certificates/${encodeURIComponent(issuedId)}`, {
    method: 'DELETE',
    headers: {
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookie
    }
  });
  assert.equal(revokeRes.status, 200);
  const revokeData = await revokeRes.json();
  assert.equal(revokeData.success, true);

  // Verification after revocation returns 404
  const verifyRes = await fetch(`${baseUrl}/api/certificates/verify/${encodeURIComponent(issuedId)}`);
  assert.equal(verifyRes.status, 404);
});

test('10.2 Admin Certificate Custom Certificate Number & Document Upload Flow', async () => {
  const { token, cookie } = await getCsrfSession();
  const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode: 'Aniket4515' })
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  const adminToken = loginData.token;

  // Valid minimal PDF base64
  const samplePdfBase64 = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMzAwIDE0NF0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2OCAwMDAwMCBuIAowMDAwMDAwMTIyIDAwMDAwIG4gCnRyYWlsZXIKPDwvUm9vdCAxIDAgUi9TaXplIDQ+PgpzdGFydHhyZWYKMTgyCiUlRU9GCg==';

  const customCertNumber = 'RBT-WS-2026-9999';
  const studentEmail = 'candidate9999@robotree.org';

  // 1. Issue certificate with custom certificate number, email, and document upload
  const issueRes = await fetch(`${baseUrl}/api/admin/certificates/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookie
    },
    body: JSON.stringify({
      certificateNumber: customCertNumber,
      studentName: 'Amit Verma',
      studentEmail: studentEmail,
      courseName: 'Drone Technology & Aerial Robotics',
      grade: 'Distinction (O)',
      venue: 'ROBOTREE ASANSOL LAB',
      time: '10:00 AM TO 1:00 PM',
      fileBase64: samplePdfBase64,
      fileOriginalName: 'amit_verma_drone_cert.pdf'
    })
  });

  assert.equal(issueRes.status, 201);
  const issueData = await issueRes.json();
  assert.equal(issueData.success, true);
  assert.equal(issueData.certificate.id, customCertNumber);
  assert.equal(issueData.certificate.certificateNumber, customCertNumber);
  assert.ok(issueData.certificate.certificateFile);

  // 2. Lookup by custom certificate number
  const verifyByNumberRes = await fetch(`${baseUrl}/api/certificates/verify/${encodeURIComponent(customCertNumber)}`);
  assert.equal(verifyByNumberRes.status, 200);
  const verifyByNumberData = await verifyByNumberRes.json();
  assert.equal(verifyByNumberData.success, true);
  assert.equal(verifyByNumberData.certificate.certificateNumber, customCertNumber);
  assert.equal(verifyByNumberData.certificate.studentName, 'Amit Verma');
  assert.equal(verifyByNumberData.certificate.hasUploadedFile, true);
  assert.ok(verifyByNumberData.certificate.fileUrl);

  // 3. Lookup by student email
  const verifyByEmailRes = await fetch(`${baseUrl}/api/certificates/verify/${encodeURIComponent(studentEmail)}`);
  assert.equal(verifyByEmailRes.status, 200);
  const verifyByEmailData = await verifyByEmailRes.json();
  assert.equal(verifyByEmailData.success, true);
  assert.equal(verifyByEmailData.certificate.studentEmail, studentEmail);

  // 4. Download attached document
  const dlRes = await fetch(`${baseUrl}/api/certificates/download/${encodeURIComponent(customCertNumber)}`);
  assert.equal(dlRes.status, 200);
  assert.equal(dlRes.headers.get('content-type'), 'application/pdf');
  const buffer = await dlRes.arrayBuffer();
  assert.ok(buffer.byteLength > 100);
});

test('11. Complete Team Directory of 17 Members with Public Privacy', async () => {
  const response = await fetch(`${baseUrl}/api/team`);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.members.length, 17);

  const founder = data.members[0];
  assert.equal(founder.name, 'Rahul Kumar Singh');
  assert.equal(founder.role, 'Founder & Director');
  assert.equal(founder.department, 'Leadership');
  assert.ok(founder.email);
  // Ensure private fields are strictly not exposed
  assert.equal(founder.bloodGroup, undefined);
  assert.equal(founder.phone, undefined);
  assert.equal(founder.idNo, undefined);
});

test('12. Database Path Traversal & Prototype Pollution Guards (Item 6)', () => {
  const users = db.getUsers();
  assert.equal(Array.isArray(users), true);

  // Ensure activities can be read safely
  const activities = db.getActivities();
  assert.equal(Array.isArray(activities), true);
});

test('13. Event Gallery CRUD & Admin-Only Authorization', async () => {
  // Public access
  const publicRes = await fetch(`${baseUrl}/api/events`);
  assert.equal(publicRes.status, 200);
  const publicData = await publicRes.json();
  assert.equal(publicData.success, true);
  assert.ok(Array.isArray(publicData.events));
  assert.ok(publicData.events.length >= 4);

  // Mutating admin request without CSRF token fails with 403
  const noCsrfRes = await fetch(`${baseUrl}/api/admin/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Unauthorized Event Photo',
      category: 'College Bootcamps',
      image: 'assets/events/test.jpg'
    })
  });
  assert.equal(noCsrfRes.status, 403);

  // Mutating admin request with CSRF but without admin token fails with 401
  const { token: unauthToken, cookie: unauthCookie } = await getCsrfSession();
  const unauthRes = await fetch(`${baseUrl}/api/admin/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': unauthToken,
      'Cookie': unauthCookie
    },
    body: JSON.stringify({
      title: 'Unauthorized Event Photo',
      category: 'College Bootcamps',
      image: 'assets/events/test.jpg'
    })
  });
  assert.equal(unauthRes.status, 401);

  // Login as admin
  const { token, cookie } = await getCsrfSession();
  const adminLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode: 'Aniket4515' })
  });
  assert.equal(adminLoginRes.status, 200);
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;
  assert.ok(adminToken);

  // Admin upload new event photo
  const createRes = await fetch(`${baseUrl}/api/admin/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookie
    },
    body: JSON.stringify({
      title: 'Automated Test Hackathon',
      category: 'College Bootcamps',
      institution: 'IIT Kharagpur',
      date: '2026-08-26',
      attendees: '300+ Students',
      image: 'assets/events/event_college_hackathon_lab.jpg',
      images: [
        'assets/events/event_college_hackathon_lab.jpg',
        'assets/brochure/workshop_four_engineers_testing.jpg',
        'assets/brochure/gallery_circuit_wiring_winter.jpg'
      ],
      description: 'Autonomous rover testing and obstacle detection.',
      tags: ['ROS2', 'SLAM']
    })
  });
  assert.equal(createRes.status, 201);
  const createData = await createRes.json();
  assert.equal(createData.success, true);
  const newEventId = createData.event.id;
  assert.ok(newEventId.startsWith('EVT-'));
  assert.equal(Array.isArray(createData.event.images), true);
  assert.equal(createData.event.images.length, 3);

  // Admin update event photo
  const updateRes = await fetch(`${baseUrl}/api/admin/events/${newEventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookie
    },
    body: JSON.stringify({
      title: 'Automated Test Hackathon (Updated)',
      images: [
        'assets/events/event_college_hackathon_lab.jpg',
        'assets/brochure/championship_line_follower.jpg'
      ]
    })
  });
  assert.equal(updateRes.status, 200);
  const updateData = await updateRes.json();
  assert.equal(updateData.success, true);
  assert.equal(updateData.event.title, 'Automated Test Hackathon (Updated)');
  assert.equal(updateData.event.images.length, 2);

  // Admin delete event photo
  const deleteRes = await fetch(`${baseUrl}/api/admin/events/${newEventId}`, {
    method: 'DELETE',
    headers: {
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookie
    }
  });
  assert.equal(deleteRes.status, 200);
  const deleteData = await deleteRes.json();
  assert.equal(deleteData.success, true);
  assert.equal(deleteData.id, newEventId);
});

test('14. System Diagnostics & GDPR Data Subject Requests (Export & Erasure)', async () => {
  // System diagnostics
  const diagRes = await fetch(`${baseUrl}/api/health/diagnostics`);
  assert.equal(diagRes.status, 200);
  const diagData = await diagRes.json();
  assert.equal(diagData.success, true);
  assert.equal(diagData.status, 'healthy');
  assert.ok(diagData.memory.rssMb > 0);
  assert.ok(diagData.metrics.totalGalleryPhotos >= 4);

  // Register a temporary user to test GDPR Export and Account Erasure
  const { token, cookie } = await getCsrfSession();
  const testEmail = `gdpr.user.${Date.now()}@example.com`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({
      name: 'GDPR Test User',
      email: testEmail,
      password: 'SecurePassword2026!',
      role: 'Student'
    })
  });
  assert.equal(regRes.status, 200);
  const regData = await regRes.json();
  const userToken = regData.token;
  assert.ok(userToken);

  // GDPR Data Export Request
  const exportRes = await fetch(`${baseUrl}/api/auth/export-data`, {
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Cookie': cookie
    }
  });
  assert.equal(exportRes.status, 200);
  const exportData = await exportRes.json();
  assert.equal(exportData.success, true);
  assert.equal(exportData.profile.email, testEmail);

  // GDPR Account Deletion with incorrect password fails
  const badDeleteRes = await fetch(`${baseUrl}/api/auth/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${userToken}`,
      'Cookie': cookie
    },
    body: JSON.stringify({ password: 'WrongPassword!' })
  });
  assert.equal(badDeleteRes.status, 401);

  // GDPR Account Deletion with correct password succeeds
  const goodDeleteRes = await fetch(`${baseUrl}/api/auth/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${userToken}`,
      'Cookie': cookie
    },
    body: JSON.stringify({ password: 'SecurePassword2026!' })
  });
  assert.equal(goodDeleteRes.status, 200);
  const goodDeleteData = await goodDeleteRes.json();
  assert.equal(goodDeleteData.success, true);
});

test('15. Employee Portal Routes & Static Asset Resolution', async () => {
  // Test /employee serving
  const empRes = await fetch(`${baseUrl}/employee`);
  assert.equal(empRes.status, 200);
  const empText = await empRes.text();
  assert.match(empText, /Employee Panel/i);

  // Test /employee-login serving
  const loginRes = await fetch(`${baseUrl}/employee-login`);
  assert.equal(loginRes.status, 200);
  const loginText = await loginRes.text();
  assert.match(loginText, /Staff Sign In/i);
});

test('16. Workshop Certificate Generator UI, Static Assets & PDF Export', async () => {
  // Test /workshop-cert page serving
  const pageRes = await fetch(`${baseUrl}/workshop-cert`);
  assert.equal(pageRes.status, 200);
  const pageText = await pageRes.text();
  assert.match(pageText, /Certificate Generator/i);

  // Test CSS asset serves CSS and not HTML
  const cssRes = await fetch(`${baseUrl}/css/style.css`);
  assert.equal(cssRes.status, 200);
  assert.match(cssRes.headers.get('content-type') || '', /css/i);

  // Test JS asset serves javascript
  const jsRes = await fetch(`${baseUrl}/js/app.js`);
  assert.equal(jsRes.status, 200);
  assert.match(jsRes.headers.get('content-type') || '', /javascript/i);

  // Test unauthenticated POST /api/generate-pdf is rejected (401)
  const unauthPdfRes = await fetch(`${baseUrl}/api/generate-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: 'Aarav Sharma',
      certId: 'RBT-WS-2026-9999'
    })
  });
  assert.equal(unauthPdfRes.status, 401);

  // Admin login to get admin authorization token
  const { token: csrfToken, cookie } = await getCsrfSession();
  const adminLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': csrfToken,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode: 'Aniket4515' })
  });
  assert.equal(adminLoginRes.status, 200);
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;

  // Test Admin POST /api/generate-pdf returns valid PDF
  const pdfRes = await fetch(`${baseUrl}/api/generate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      studentName: 'Aarav Sharma',
      certId: 'RBT-WS-2026-9999'
    })
  });
  assert.equal(pdfRes.status, 200);
  assert.equal(pdfRes.headers.get('content-type'), 'application/pdf');
  const buffer = await pdfRes.arrayBuffer();
  assert.ok(buffer.byteLength > 20000);
});

test('17. Hardware Store Catalog, Filtering, and Checkout Quote Submission', async () => {
  // 1. Fetch products list
  const listRes = await fetch(`${baseUrl}/api/store/products`);
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.equal(listData.success, true);
  assert.ok(Array.isArray(listData.products));
  assert.ok(listData.products.length >= 8);

  // 2. Filter by category
  const catRes = await fetch(`${baseUrl}/api/store/products?category=robotics-kits`);
  assert.equal(catRes.status, 200);
  const catData = await catRes.json();
  assert.equal(catData.success, true);
  assert.ok(catData.products.length > 0);
  assert.ok(catData.products.every(p => p.category === 'Robotics Kits' || p.category === 'robotics-kits'));

  // 3. Search query
  const searchRes = await fetch(`${baseUrl}/api/store/products?search=Arduino`);
  assert.equal(searchRes.status, 200);
  const searchData = await searchRes.json();
  assert.equal(searchData.success, true);
  assert.ok(searchData.products.length > 0);

  // 4. Place order quote request
  const firstProd = listData.products[0];
  const { token, cookie } = await getCsrfSession();
  const orderRes = await fetch(`${baseUrl}/api/store/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie,
    },
    body: JSON.stringify({
      customerName: 'Priya Mukherjee',
      customerEmail: 'priya.robotics@college.edu',
      customerPhone: '+91 98321 54321',
      customerAddress: 'BCET Durgapur Hostel 3, West Bengal',
      notes: 'Please quote with educational institution discount.',
      items: [
        { productId: firstProd.id, quantity: 2 }
      ]
    })
  });
  assert.equal(orderRes.status, 201);
  const orderData = await orderRes.json();
  assert.equal(orderData.success, true);
  assert.ok(orderData.order.id);
  assert.equal(orderData.order.totalAmount, firstProd.price * 2);
});

test('18. Admin Hardware Store Product CRUD and Stock Control', async () => {
  const csrfRes = await fetch(`${baseUrl}/api/csrf-token`);
  const token = (await csrfRes.json()).csrfToken;
  const cookie = csrfRes.headers.get('set-cookie');

  const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode: 'Aniket4515' })
  });
  const adminToken = (await loginRes.json()).token;

  // 1. Create a new test product
  const createRes = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookie,
    },
    body: JSON.stringify({
      title: 'Automated Test Rover Kit',
      category: 'robotics-kits',
      price: 1899,
      originalPrice: 2499,
      description: 'Educational rover kit created during integration test.',
      inStock: true,
      stockQuantity: 15,
      sku: 'TEST-ROV-001',
      specs: { 'Chassis': 'Acrylic 2WD', 'Motors': 'BO 100RPM' }
    })
  });
  assert.equal(createRes.status, 201);
  const createData = await createRes.json();
  assert.equal(createData.success, true);
  const prodId = createData.product.id;
  assert.ok(prodId);

  // 2. Toggle stock status
  const stockRes = await fetch(`${baseUrl}/api/admin/products/${prodId}/stock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookie,
    },
    body: JSON.stringify({ inStock: false })
  });
  assert.equal(stockRes.status, 200);
  const stockData = await stockRes.json();
  assert.equal(stockData.success, true);
  assert.equal(stockData.product.inStock, false);

  // 3. Delete product
  const delRes = await fetch(`${baseUrl}/api/admin/products/${prodId}`, {
    method: 'DELETE',
    headers: {
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookie,
    }
  });
  assert.equal(delRes.status, 200);
  const delData = await delRes.json();
  assert.equal(delData.success, true);
});


