import fs from 'node:fs';

async function runAllVerifications() {
  const fetch = globalThis.fetch;
  const results = [];

  function assert(name, condition, details = '') {
    if (condition) {
      console.log('✅ PASS:', name);
      results.push({ name, pass: true });
    } else {
      console.error('❌ FAIL:', name, details);
      results.push({ name, pass: false, details });
    }
  }

  // 1. Pages HTTP status check
  const pages = [
    '/', '/about.html', '/team.html', '/courses.html', '/services.html', 
    '/gallery.html', '/certificate.html', '/contact.html', '/admin.html', 
    '/store.html', '/store', '/employee.html', '/employee-login.html', '/workshop-cert'
  ];
  for (const page of pages) {
    const res = await fetch('http://127.0.0.1:5000' + page);
    assert('Page loads: ' + page, res.status === 200, 'Status was ' + res.status);
  }

  // 2. Navigation store link check across pages
  const navPages = ['/', '/about.html', '/team.html', '/courses.html', '/services.html', '/gallery.html', '/certificate.html', '/contact.html'];
  for (const page of navPages) {
    const res = await fetch('http://127.0.0.1:5000' + page);
    const html = await res.text();
    assert('Store link in nav: ' + page, html.includes('store.html') || html.includes('href="store"'), 'Missing store link');
  }

  // 3. Hardware Store Catalog API
  const prodRes = await fetch('http://127.0.0.1:5000/api/store/products');
  const prodData = await prodRes.json();
  assert('Store API returns products', prodData.success === true && prodData.products.length >= 8, 'Found: ' + (prodData.products ? prodData.products.length : 0));
  
  const kitFilterRes = await fetch('http://127.0.0.1:5000/api/store/products?category=robotics-kits');
  const kitData = await kitFilterRes.json();
  assert('Store API category filter works', kitData.success === true && kitData.products.length > 0, 'Found: ' + (kitData.products ? kitData.products.length : 0));

  const searchRes = await fetch('http://127.0.0.1:5000/api/store/products?search=Arduino');
  const searchData = await searchRes.json();
  assert('Store API search works', searchData.success === true && searchData.products.length > 0, 'Found: ' + (searchData.products ? searchData.products.length : 0));

  // 4. Store Order Placement API
  const csrfRes = await fetch('http://127.0.0.1:5000/api/csrf-token');
  const rawCookieHeader = csrfRes.headers.get('set-cookie') || '';
  const csrfCookie = rawCookieHeader.split(';')[0];
  const csrfJson = await csrfRes.json();
  const csrfToken = csrfJson.csrfToken;

  const orderRes = await fetch('http://127.0.0.1:5000/api/store/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'Cookie': csrfCookie
    },
    body: JSON.stringify({
      customerName: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+91 98765 43210',
      institution: 'BIT Sindri',
      shippingAddress: 'Hostel 7, BIT Sindri, Dhanbad, Jharkhand',
      items: [
        { productId: prodData.products[0].id, quantity: 2 }
      ],
      notes: 'Please expedite delivery for upcoming tech fest.'
    })
  });
  const orderData = await orderRes.json();
  assert('Store order submission succeeds', orderRes.status === 201 && orderData.success === true && Boolean(orderData.order?.id), JSON.stringify(orderData));

  // Clean up verification test order so test runs do not leave stale entries in inquiries table
  if (orderData.order?.id) {
    try {
      const fs = await import('node:fs');
      const inqPath = './data/inquiries.json';
      const ordPath = './data/orders.json';
      if (fs.existsSync(inqPath)) {
        const inqs = JSON.parse(fs.readFileSync(inqPath, 'utf8'));
        fs.writeFileSync(inqPath, JSON.stringify(inqs.filter(i => i.id !== `INQ-${orderData.order.id}`), null, 2));
      }
      if (fs.existsSync(ordPath)) {
        const ords = JSON.parse(fs.readFileSync(ordPath, 'utf8'));
        fs.writeFileSync(ordPath, JSON.stringify(ords.filter(o => o.id !== orderData.order.id), null, 2));
      }
    } catch (_) {}
  }

  // 5. Admin Store & Failed Logins UI elements in admin.html
  const adminRes = await fetch('http://127.0.0.1:5000/admin.html');
  const adminHtml = await adminRes.text();
  assert('Admin has Store Tab button', adminHtml.includes('data-admin-tab="store"'));
  assert('Admin has Store Management Section', adminHtml.includes('id="adminSectionStore"'));
  assert('Admin has Product Image Dropzone', adminHtml.includes('id="adminProdDropzone"'));
  assert('Admin has Failed Logins Monitor Card', adminHtml.includes('id="adminFailedLoginsCard"') && !adminHtml.includes('id="adminFailedLoginsCard" hidden'));

  // 6. Award image accessible
  const awardImgRes = await fetch('http://127.0.0.1:5000/assets/award_world_robotics_2017.png');
  assert('Award image accessible', awardImgRes.status === 200 && Number(awardImgRes.headers.get('content-length')) > 500000);

  // 7. Check if index.html contains the award spotlight
  const indexRes = await fetch('http://127.0.0.1:5000/');
  const indexHtml = await indexRes.text();
  assert('Index contains award spotlight', indexHtml.includes('World Robotics Championship') && indexHtml.includes('award_world_robotics_2017'));

  // 8. Showcase Gallery API & UI elements
  const showcaseRes = await fetch('http://127.0.0.1:5000/api/showcase');
  const showcaseData = await showcaseRes.json();
  assert('Showcase API returns items', showcaseRes.status === 200 && showcaseData.success === true && Array.isArray(showcaseData.items) && showcaseData.items.length >= 20, 'Count: ' + (showcaseData.items ? showcaseData.items.length : 0));

  assert('Admin has Showcase subnav and grid', adminHtml.includes('id="gallerySubnav"') && adminHtml.includes('id="adminShowcaseGrid"') && adminHtml.includes('id="showcaseFormDrawer"'));

  const galleryRes = await fetch('http://127.0.0.1:5000/gallery.html');
  const galleryHtml = await galleryRes.text();
  assert('Gallery has pictureGalleryMasonry container', galleryHtml.includes('id="pictureGalleryMasonry"'));

  const totalFailed = results.filter(r => !r.pass).length;
  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log('Total checks:', results.length, '| Passed:', results.length - totalFailed, '| Failed:', totalFailed);
  process.exit(totalFailed === 0 ? 0 : 1);
}

runAllVerifications().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
