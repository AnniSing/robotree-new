import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

async function testShowcaseLifecycle() {
  console.log('--- TESTING SHOWCASE GALLERY API & CRUD LIFECYCLE ---');

  let server;
  let tempDataDir = null;
  let BASE_URL = 'http://127.0.0.1:5000';
  try {
    const probe = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(300) });
    if (!probe.ok) throw new Error('Not running');
  } catch {
    tempDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'robotree-showcase-test-'));
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

  try {

  // 1. Fetch CSRF token
  const csrfRes = await fetch(`${BASE_URL}/api/csrf-token`);
  assert.strictEqual(csrfRes.status, 200, 'CSRF token endpoint should return 200');
  const rawCookieHeader = csrfRes.headers.get('set-cookie') || '';
  const cookieVal = rawCookieHeader.split(';')[0];
  const { csrfToken } = await csrfRes.json();
  assert.ok(csrfToken, 'Should receive CSRF token');

  // 2. Public GET /api/showcase
  const getRes = await fetch(`${BASE_URL}/api/showcase`);
  assert.strictEqual(getRes.status, 200, 'Public showcase endpoint should return 200');
  const getData = await getRes.json();
  assert.strictEqual(getData.success, true);
  assert.ok(Array.isArray(getData.items), 'Showcase items should be an array');
  const initialCount = getData.items.length;
  console.log(`✅ PASS: Public GET /api/showcase returned ${initialCount} items`);

  // Verify the 4 specific photos from user screenshot are present
  const requiredTitles = [
    'JNV Kolasib (Mizoram) • PM SHRI Science Lab',
    'JNV Kolasib (North Thingdawl) • Circuit Prototyping',
    'North Point School, Asansol • Electronics & Logic Lab',
    'North Point School, Asansol • Hands-on Circuitry'
  ];
  for (const title of requiredTitles) {
    const found = getData.items.find(item => item.title === title);
    assert.ok(found, `Showcase should include "${title}"`);
  }
  console.log('✅ PASS: All 4 user-highlighted showcase photos are present in data store');

  // 3. Admin login
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': BASE_URL,
      'X-CSRF-Token': csrfToken,
      'Cookie': cookieVal
    },
    body: JSON.stringify({ passcode: 'Anni4515' })
  });
  assert.strictEqual(loginRes.status, 200, 'Admin login should succeed');
  const loginData = await loginRes.json();
  assert.ok(loginData.token, 'Should receive admin token');
  const adminToken = loginData.token;
  const adminSetCookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];
  const combinedCookie = adminSetCookie ? `${cookieVal}; ${adminSetCookie}` : cookieVal;
  console.log('✅ PASS: Admin authenticated successfully');

  // 4. Admin CREATE Showcase Photo
  const testId = `test-showcase-${Date.now()}`;
  const createRes = await fetch(`${BASE_URL}/api/admin/showcase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': BASE_URL,
      'Authorization': `Bearer ${adminToken}`,
      'X-CSRF-Token': csrfToken,
      'Cookie': combinedCookie
    },
    body: JSON.stringify({
      id: testId,
      title: 'Automated Test Lab Showcase',
      caption: 'Robotics Workshop in Session',
      imageUrl: 'assets/gallery_3d_printer_in_action.jpg',
      aspectRatio: 'wide'
    })
  });
  assert.strictEqual(createRes.status, 201, 'Admin showcase creation should return 201');
  const createData = await createRes.json();
  assert.strictEqual(createData.success, true);
  console.log('✅ PASS: Created new showcase photo via admin API');

  // 5. Admin UPDATE Showcase Photo
  const updateRes = await fetch(`${BASE_URL}/api/admin/showcase/${testId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Origin': BASE_URL,
      'Authorization': `Bearer ${adminToken}`,
      'X-CSRF-Token': csrfToken,
      'Cookie': combinedCookie
    },
    body: JSON.stringify({
      title: 'Automated Test Lab Showcase (Updated)',
      caption: 'Advanced AI & Embedded Systems Prototyping',
      aspectRatio: 'standard'
    })
  });
  assert.strictEqual(updateRes.status, 200, 'Admin showcase update should return 200');
  const updateData = await updateRes.json();
  assert.strictEqual(updateData.success, true);
  assert.strictEqual(updateData.item.title, 'Automated Test Lab Showcase (Updated)');
  console.log('✅ PASS: Updated showcase photo metadata and layout format');

  // 6. Public verification of update
  const verifyRes = await fetch(`${BASE_URL}/api/showcase`);
  const verifyData = await verifyRes.json();
  const updatedItem = verifyData.items.find(i => i.id === testId);
  assert.ok(updatedItem, 'Newly added item should appear in public showcase endpoint');
  assert.strictEqual(updatedItem.title, 'Automated Test Lab Showcase (Updated)');
  console.log('✅ PASS: Public endpoint dynamically reflected updated showcase photo');

  // 7. Admin DELETE Showcase Photo
  const deleteRes = await fetch(`${BASE_URL}/api/admin/showcase/${testId}`, {
    method: 'DELETE',
    headers: {
      'Origin': BASE_URL,
      'Authorization': `Bearer ${adminToken}`,
      'X-CSRF-Token': csrfToken,
      'Cookie': combinedCookie
    }
  });
  assert.strictEqual(deleteRes.status, 200, 'Admin showcase delete should return 200');
  console.log('✅ PASS: Deleted test showcase photo via admin API');

  // 8. Public verification of delete
  const finalRes = await fetch(`${BASE_URL}/api/showcase`);
  const finalData = await finalRes.json();
  const deletedItem = finalData.items.find(i => i.id === testId);
  assert.strictEqual(deletedItem, undefined, 'Deleted item should no longer appear');
  assert.strictEqual(finalData.items.length, initialCount, 'Item count should return to initial count');
  console.log('✅ PASS: Public endpoint confirms complete item deletion');

  console.log('\n--- ALL SHOWCASE CRUD TESTS PASSED SUCCESSFULLY ---');
  } finally {
    if (server) server.close();
    if (tempDataDir) fs.rmSync(tempDataDir, { recursive: true, force: true });
  }
}

testShowcaseLifecycle().catch(err => {
  console.error('❌ Showcase test failed:', err);
  process.exit(1);
});
