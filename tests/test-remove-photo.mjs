import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let server;
let tempDataDir = null;
let baseUrl = 'http://localhost:5000';
try {
  const probe = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(300) });
  if (!probe.ok) throw new Error('Not running');
} catch {
  tempDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'robotree-photo-test-'));
  fs.cpSync(path.resolve('data'), tempDataDir, { recursive: true });
  process.env.ROBOTREE_DATA_DIR = tempDataDir;
  const { app } = await import('../server.js');
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
}

console.log('--- TESTING REMOVE PHOTO FUNCTIONALITY ---');

// 1. Static markup verification
const adminHtml = fs.readFileSync('admin.html', 'utf8');
assert.ok(adminHtml.includes('id="btnRemoveProdImg"'), 'admin.html must contain #btnRemoveProdImg');
assert.ok(adminHtml.includes('id="adminProdDropzone"'), 'admin.html must contain #adminProdDropzone');
assert.ok(adminHtml.includes('id="adminProdDropzonePreview"'), 'admin.html must contain #adminProdDropzonePreview');
assert.ok(adminHtml.includes('Remove Photo'), 'admin.html must contain "Remove Photo" text');

// Ensure adminProdDropzonePreview is outside adminProdDropzone to prevent click bubble triggering file chooser
const dropzoneIdx = adminHtml.indexOf('id="adminProdDropzone"');
const dropzoneEndIdx = adminHtml.indexOf('</div>', dropzoneIdx + 100);
const previewIdx = adminHtml.indexOf('id="adminProdDropzonePreview"');
assert.ok(previewIdx > dropzoneEndIdx, 'adminProdDropzonePreview must be outside adminProdDropzone');
console.log('✅ PASS: Markup structure & separation verified');

// 2. Script logic verification
const scriptJs = fs.readFileSync('script.js', 'utf8');
assert.ok(scriptJs.includes('removePhotoFlag = true;'), 'script.js must set removePhotoFlag on clearImagePreview');
assert.ok(scriptJs.includes("previewWrap.style.display = 'none';"), 'script.js must set previewWrap.style.display to none');
assert.ok(scriptJs.includes("previewImg.removeAttribute('src')"), 'script.js must clear previewImg.src attribute');
assert.ok(scriptJs.includes('removeImage: Boolean(removePhotoFlag && !imageBase64Input.value)'), 'script.js must include removeImage flag in payload');
console.log('✅ PASS: JavaScript logic & event listeners verified');

// 3. Live API test for product photo creation, removal, and persistence
async function getCsrfSession() {
  const res = await fetch(`${baseUrl}/api/csrf-token`);
  const data = await res.json();
  const rawCookie = res.headers.get('set-cookie') || '';
  const cookie = rawCookie.split(';')[0];
  return { token: data.csrfToken, cookie };
}

async function runLivePhotoTest() {
  const { token, cookie } = await getCsrfSession();

  const passcode = 'Anni4515';

  // Admin login
  const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Cookie': cookie
    },
    body: JSON.stringify({ passcode })
  });
  assert.equal(loginRes.status, 200, 'Admin login must succeed');
  const loginData = await loginRes.json();
  const adminToken = loginData.token;

  // Create product with photo
  const initialImage = 'assets/store/kit_4wd_robot.jpg';
  const createRes = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookie
    },
    body: JSON.stringify({
      title: 'Photo Removal Test Robot',
      category: 'robotics-kits',
      price: 2499,
      image: initialImage,
      description: 'Test product for photo remove validation'
    })
  });
  assert.equal(createRes.status, 201, 'Product creation must return 201');
  const createData = await createRes.json();
  const prodId = createData.product.id;
  assert.equal(createData.product.image, initialImage, 'Product should have initial image');
  console.log(`✅ PASS: Created test product ${prodId} with image: ${initialImage}`);

  // Update product to REMOVE PHOTO (simulating user clicking Remove Photo and saving)
  const removeRes = await fetch(`${baseUrl}/api/admin/products/${encodeURIComponent(prodId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
      'X-CSRF-Token': token,
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': cookie
    },
    body: JSON.stringify({
      title: 'Photo Removal Test Robot',
      category: 'robotics-kits',
      price: 2499,
      image: '',
      removeImage: true
    })
  });
  assert.equal(removeRes.status, 200, 'Product update must return 200');
  const removeData = await removeRes.json();
  assert.equal(removeData.product.image, '', 'Product image must be empty string after removal');
  console.log('✅ PASS: Product image successfully removed via API with removeImage flag');

  // Verify catalog query returns product without image
  const getRes = await fetch(`${baseUrl}/api/store/products?search=Photo%20Removal`);
  assert.equal(getRes.status, 200);
  const getData = await getRes.json();
  const fetchedProd = getData.products.find(p => p.id === prodId);
  assert.ok(fetchedProd, 'Product must be found in catalog');
  assert.equal(fetchedProd.image, '', 'Catalog product must have empty image');
  console.log('✅ PASS: Catalog retrieval confirms image is permanently removed');

  // Clean up
  const delRes = await fetch(`${baseUrl}/api/admin/products/${encodeURIComponent(prodId)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'X-CSRF-Token': token,
      'Cookie': cookie
    }
  });
  assert.equal(delRes.status, 200, 'Product cleanup must succeed');
  console.log('✅ PASS: Cleaned up test product');
}

try {
  await runLivePhotoTest();
  console.log('\n--- ALL REMOVE PHOTO TESTS PASSED SUCCESSFULLY ---');
} finally {
  if (server) server.close();
  if (tempDataDir) fs.rmSync(tempDataDir, { recursive: true, force: true });
}
