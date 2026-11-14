import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let server;
let tempDataDir = null;
let BASE_URL = 'http://localhost:5000';
try {
  const probe = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(300) });
  if (!probe.ok) throw new Error('Not running');
} catch {
  tempDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'robotree-cert-test-'));
  fs.cpSync(path.resolve('data'), tempDataDir, { recursive: true });
  process.env.ROBOTREE_DATA_DIR = tempDataDir;
  const { app } = await import('../server.js');
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      BASE_URL = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
}

async function run() {
  try {
  console.log('--- TESTING CERTIFICATE ENROLLMENT & INQUIRY PRODUCT IMAGE FEATURES ---');

  // 1. Verify student access to certificate by Enrollment Number
  const verifyRes = await fetch(`${BASE_URL}/api/certificates/verify/ENR-2026-001`);
  assert.equal(verifyRes.status, 200, 'Student should be able to verify certificate by enrollment number');
  const verifyData = await verifyRes.json();
  assert.equal(verifyData.success, true, 'Verification should succeed');
  assert.equal(verifyData.certificate.enrollmentNo, 'ENR-2026-001', 'Certificate enrollment number should match');
  assert.equal(verifyData.certificate.studentName, 'Aniket', 'Student name should match');
  assert.ok(verifyData.certificate.certificateFile, 'Certificate file path should exist');
  console.log('✅ PASS: Student can access and verify certificate via Enrollment Number ENR-2026-001');

  // 2. Verify inline PDF certificate viewing
  const pdfRes = await fetch(`${BASE_URL}/api/certificates/download/RBT-WS-2026-6354?view=inline`);
  assert.equal(pdfRes.status, 200, 'PDF download/inline endpoint should return 200 OK');
  assert.equal(pdfRes.headers.get('content-type'), 'application/pdf', 'Content-Type should be application/pdf');
  const disp = pdfRes.headers.get('content-disposition') || '';
  assert.ok(disp.startsWith('inline'), `Content-Disposition should be inline, got: ${disp}`);
  console.log('✅ PASS: Certificate PDF correctly delivers with inline Content-Disposition for browser preview');

  // 3. Admin Authentication
  const csrfRes = await fetch(`${BASE_URL}/api/csrf-token`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const cookieVal = (csrfRes.headers.get('set-cookie') || '').split(';')[0];

  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': BASE_URL,
      'X-CSRF-Token': csrfToken,
      'Cookie': cookieVal,
    },
    body: JSON.stringify({ passcode: 'Anni4515' }),
  });
  assert.equal(loginRes.status, 200, 'Admin login should succeed');
  const loginData = await loginRes.json();
  const adminToken = loginData.token;
  const adminSetCookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];
  const combinedCookie = adminSetCookie ? `${cookieVal}; ${adminSetCookie}` : cookieVal;
  console.log('✅ PASS: Admin successfully authenticated');

  // 4. Admin Issues a New Certificate with Enrollment Number & Scanned PDF
  const testCertId = `RRT-TEST-${Date.now()}`;
  const testEnrollmentNo = `ENR-TEST-${Date.now()}`;
  const dummyPdfBase64 = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4 %Robotree Test Certificate').toString('base64');

  const issueRes = await fetch(`${BASE_URL}/api/admin/certificates/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': BASE_URL,
      'Authorization': `Bearer ${adminToken}`,
      'X-CSRF-Token': csrfToken,
      'Cookie': combinedCookie,
    },
    body: JSON.stringify({
      studentName: 'Priya Sharma',
      studentEmail: 'priya.sharma@example.com',
      enrollmentNo: testEnrollmentNo,
      courseTitle: 'Advanced Embedded Robotics & IoT',
      certificateNumber: testCertId,
      issueDate: '2026-10-20',
      grade: 'Distinction (A++)',
      venue: 'Robotree Asansol Main Lab',
      time: '10:00 AM - 01:00 PM',
      fileBase64: dummyPdfBase64,
      fileOriginalName: 'Priya_Sharma_Robotics_Certificate.pdf',
    }),
  });
  assert.ok(issueRes.status === 200 || issueRes.status === 201, `Admin certificate issue status should be 200 or 201, got ${issueRes.status}`);
  const issueData = await issueRes.json();
  assert.equal(issueData.success, true, 'Issue response success should be true');
  assert.equal(issueData.certificate.enrollmentNo, testEnrollmentNo, 'Issued certificate should persist enrollmentNo');
  console.log(`✅ PASS: Admin successfully issued certificate with Enrollment No ${testEnrollmentNo} and attached PDF`);

  // 5. Verify the newly created certificate can be retrieved by student using Enrollment Number
  const studentVerifyRes = await fetch(`${BASE_URL}/api/certificates/verify/${testEnrollmentNo}`);
  assert.equal(studentVerifyRes.status, 200, 'Student should be able to verify newly issued certificate');
  const studentVerifyData = await studentVerifyRes.json();
  assert.equal(studentVerifyData.success, true);
  assert.equal(studentVerifyData.certificate.studentName, 'Priya Sharma');
  assert.equal(studentVerifyData.certificate.enrollmentNo, testEnrollmentNo);
  console.log('✅ PASS: Student can immediately query and view newly issued certificate via new Enrollment Number');

  // 6. Test Inquiries list has product images and product titles
  let testOrderId = null;
  const initialDashboardRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': combinedCookie,
    },
  });
  const initialData = await initialDashboardRes.json();
  let productOrderInquiry = (initialData.inquiries || []).find(i => i.orderId || i.productId || (i.items && i.items.length > 0));

  if (!productOrderInquiry) {
    const orderRes = await fetch(`${BASE_URL}/api/store/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
        'X-CSRF-Token': csrfToken,
        'Cookie': combinedCookie,
      },
      body: JSON.stringify({
        customerName: 'Test Student',
        customerEmail: 'test.student@example.com',
        customerPhone: '+91 99999 88888',
        customerAddress: '123 Robotics Way, Tech Park',
        items: [{ productId: 'PROD-RBT-001', title: '4WD Autonomous Obstacle Avoidance Robot Kit', price: 2499, quantity: 1 }],
      }),
    });
    const orderData = await orderRes.json();
    testOrderId = orderData.order?.id;
  }

  const dashboardRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': combinedCookie,
    },
  });
  assert.equal(dashboardRes.status, 200, 'Admin dashboard request should succeed');
  const dashboardData = await dashboardRes.json();
  const inquiries = dashboardData.inquiries || [];
  assert.ok(inquiries.length > 0, 'Inquiries should exist');
  
  productOrderInquiry = inquiries.find(i => i.orderId || i.productId || (i.items && i.items.length > 0));
  assert.ok(productOrderInquiry, 'At least one inquiry should have order/product data');
  assert.ok(productOrderInquiry.productTitle || (productOrderInquiry.items && productOrderInquiry.items[0]?.title), 'Inquiry must have product title');
  assert.ok(productOrderInquiry.productImage || (productOrderInquiry.items && productOrderInquiry.items[0]?.image), 'Inquiry must have product image');
  console.log('✅ PASS: Inquiries list contains product photo, title, and order details for hardware orders');

  if (testOrderId) {
    await fetch(`${BASE_URL}/api/admin/inquiries/INQ-${testOrderId}`, {
      method: 'DELETE',
      headers: {
        'Origin': BASE_URL,
        'Authorization': `Bearer ${adminToken}`,
        'Cookie': combinedCookie,
        'X-CSRF-Token': csrfToken,
      },
    });
  }

  // 7. Cleanup test certificate
  const createdId = issueData.certificate.id || testCertId;
  const deleteRes = await fetch(`${BASE_URL}/api/admin/certificates/${createdId}`, {
    method: 'DELETE',
    headers: {
      'Origin': BASE_URL,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': combinedCookie,
      'X-CSRF-Token': csrfToken,
    },
  });
  assert.equal(deleteRes.status, 200, 'Cleanup test certificate should succeed');
  console.log('✅ PASS: Cleaned up test certificate');

  // Also clean up debug certificate RRT-2026-0032-1578 if present
  await fetch(`${BASE_URL}/api/admin/certificates/RRT-2026-0032-1578`, {
    method: 'DELETE',
    headers: {
      'Origin': BASE_URL,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': combinedCookie,
      'X-CSRF-Token': csrfToken,
    },
  });

  console.log('\n--- ALL CERTIFICATE ENROLLMENT & PRODUCT INQUIRY TESTS PASSED ---');
  } finally {
    if (server) server.close();
    if (tempDataDir) fs.rmSync(tempDataDir, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
