import { strict as assert } from 'node:assert';
import fs from 'node:fs';

console.log('--- TESTING QUICK VIEW MODAL & INTERACTIONS ---');

// 1. Check HTML markup
const storeHtml = fs.readFileSync('store.html', 'utf8');
assert.ok(storeHtml.includes('id="productQuickViewModal"'), 'productQuickViewModal element must exist');
assert.ok(storeHtml.includes('class="modal-backdrop" id="productQuickViewModal"'), 'productQuickViewModal must be a modal-backdrop');
assert.ok(!storeHtml.includes('<dialog class="modal" id="productQuickViewModal"'), 'productQuickViewModal must not be a native dialog');
assert.ok(storeHtml.includes('id="closeQuickViewModalBtn"'), 'closeQuickViewModalBtn must exist');
assert.ok(storeHtml.includes('id="qvImage"'), 'qvImage must exist');
assert.ok(storeHtml.includes('id="qvTitle"'), 'qvTitle must exist');
assert.ok(storeHtml.includes('id="qvPrice"'), 'qvPrice must exist');
assert.ok(storeHtml.includes('id="qvFeaturesList"'), 'qvFeaturesList must exist');
assert.ok(storeHtml.includes('id="qvAddToCartBtn"'), 'qvAddToCartBtn must exist');
assert.ok(storeHtml.includes('class="modal-backdrop" id="storeCheckoutModal"'), 'storeCheckoutModal must be a modal-backdrop');
console.log('✅ PASS: store.html markup structure');

// 2. Check CSS styling
const css = fs.readFileSync('styles.css', 'utf8');
assert.ok(css.includes('.modal-card.modal-lg'), '.modal-card.modal-lg rule must exist');
assert.ok(css.includes('.qv-grid'), '.qv-grid rule must exist');
assert.ok(css.includes('.qv-image-col'), '.qv-image-col rule must exist');
assert.ok(css.includes('.qv-title'), '.qv-title rule must exist');
assert.ok(css.includes('.qv-stock-tag'), '.qv-stock-tag rule must exist');
console.log('✅ PASS: styles.css Quick View rules');

// 3. Check script.js logic
const scriptJs = fs.readFileSync('script.js', 'utf8');
assert.ok(scriptJs.includes('openQuickView'), 'openQuickView function must exist');
assert.ok(scriptJs.includes('closeQuickView'), 'closeQuickView function must exist');
assert.ok(scriptJs.includes('store-btn-qv'), 'store-btn-qv click listener must exist');
assert.ok(scriptJs.includes("qvModal.hidden = false"), 'qvModal.hidden = false must be present');
assert.ok(scriptJs.includes("document.body.classList.add('modal-open')"), 'modal-open class must be added');
assert.ok(scriptJs.includes("document.body.classList.remove('modal-open')"), 'modal-open class must be removed on close');
console.log('✅ PASS: script.js Quick View logic');

// 4. Test live fetch against running server
let server;
let BASE_URL = 'http://127.0.0.1:5000';
try {
  const probe = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(300) });
  if (!probe.ok) throw new Error('Not running');
} catch {
  const { app } = await import('../server.js');
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      BASE_URL = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
}

try {
  const res = await fetch(`${BASE_URL}/store.html`);
  assert.equal(res.status, 200);
  const liveHtml = await res.text();
  assert.ok(liveHtml.includes('id="productQuickViewModal"'), 'Live store.html has productQuickViewModal');
  assert.ok(liveHtml.includes('class="modal-backdrop" id="productQuickViewModal"'), 'Live store.html has modal-backdrop for Quick View');

  const resRoute = await fetch(`${BASE_URL}/store`);
  assert.equal(resRoute.status, 200);
  const liveRouteHtml = await resRoute.text();
  assert.ok(liveRouteHtml.includes('id="productQuickViewModal"'), 'Live /store route has productQuickViewModal');
  console.log('✅ PASS: Live HTTP endpoints deliver updated Quick View modal');

  console.log('\n--- ALL QUICK VIEW TESTS PASSED SUCCESSFULLY ---');
} finally {
  if (server) server.close();
}
