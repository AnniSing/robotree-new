import { spawn } from 'node:child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const viewports = [
  { name: 'small-mobile', width: 320, height: 568 },
  { name: 'mobile', width: 375, height: 812 },
  { name: 'modern-phone', width: 390, height: 844 },
  { name: 'large-phone', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop-small', width: 1024, height: 768 },
  { name: 'laptop-std', width: 1366, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'large-desktop', width: 1920, height: 1080 }
];

const pages = [
  '/',
  '/about.html',
  '/team.html',
  '/courses.html',
  '/services.html',
  '/gallery.html',
  '/certificate.html',
  '/contact.html',
  '/admin.html',
  '/store.html',
  '/employee.html',
  '/employee-login.html',
  '/privacy.html',
  '/terms.html',
  '/workshop-cert'
];

async function run() {
  const proc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  try {
    // Wait for Edge to spin up
    let connected = false;
    let versionData;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        const res = await fetch('http://127.0.0.1:9223/json/new', { method: 'PUT' });
        versionData = await res.json();
        if (versionData && versionData.webSocketDebuggerUrl) {
          connected = true;
          break;
        }
      } catch (e) {}
    }

    if (!connected) {
      throw new Error('Could not connect to Edge DevTools');
    }

    const wsUrl = versionData.webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const curId = id++;
        pending.set(curId, { resolve, reject });
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('--- STARTING RESPONSIVE AUDIT ---');
    const issues = [];

    for (const page of pages) {
      console.log(`\nAuditing page: ${page}`);
      for (const vp of viewports) {
        await send('Emulation.setDeviceMetricsOverride', {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 1,
          mobile: vp.width <= 768
        });

        await send('Page.navigate', { url: `http://127.0.0.1:5000${page}` });
        // Wait 400ms for layout to settle
        await new Promise(r => setTimeout(r, 400));

        const evalRes = await send('Runtime.evaluate', {
          expression: `(() => {
            const innerWidth = window.innerWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
            const hasOverflow = scrollWidth > (innerWidth + 1) || bodyScrollWidth > (innerWidth + 1);
            
            const allElements = Array.from(document.querySelectorAll('*'));
            const overflowingElements = [];
            for (const el of allElements) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                if (rect.right > (innerWidth + 1) && el !== document.documentElement && el !== document.body) {
                  let p = el.parentElement;
                  let contained = false;
                  while (p && p !== document.body && p !== document.documentElement) {
                    const style = window.getComputedStyle(p);
                    if (['hidden', 'auto', 'scroll', 'clip'].includes(style.overflowX)) {
                      contained = true;
                      break;
                    }
                    p = p.parentElement;
                  }
                  if (!contained) {
                    overflowingElements.push({
                      tag: el.tagName,
                      id: el.id,
                      className: (typeof el.className === 'string') ? el.className.slice(0, 50) : '',
                      rect: { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }
                    });
                  }
                }
              }
            }

            const navToggle = document.querySelector('.nav-toggle');
            const navToggleVisible = navToggle ? window.getComputedStyle(navToggle).display !== 'none' : null;

            return {
              innerWidth,
              scrollWidth,
              bodyScrollWidth,
              hasOverflow,
              overflowCount: overflowingElements.length,
              topOverflowing: overflowingElements.slice(0, 3),
              navToggleVisible
            };
          })()`,
          returnByValue: true
        });

        const r = evalRes.result.value;
        if (r.hasOverflow || r.overflowCount > 0) {
          const detail = {
            page,
            viewport: `${vp.name} (${vp.width}x${vp.height})`,
            innerWidth: r.innerWidth,
            scrollWidth: r.scrollWidth,
            bodyScrollWidth: r.bodyScrollWidth,
            topOverflowing: r.topOverflowing
          };
          issues.push(detail);
          console.log(`  ❌ OVERFLOW [${vp.name} ${vp.width}px]: scrollWidth=${r.scrollWidth} > innerWidth=${r.innerWidth}`);
          if (r.topOverflowing && r.topOverflowing.length > 0) {
            console.log(`     Elements:`, JSON.stringify(r.topOverflowing));
          }
        } else {
          // Check nav toggle for mobile
          if (vp.width <= 768 && r.navToggleVisible === false && page !== '/employee.html' && page !== '/employee-login.html' && page !== '/workshop-cert') {
            console.log(`  ⚠️ Nav toggle hidden on mobile: ${vp.name}`);
          } else {
            console.log(`  ✅ [${vp.name} ${vp.width}px]: OK`);
          }
        }
      }
    }

    console.log('\n--- AUDIT COMPLETE ---');
    console.log(`Total issues identified: ${issues.length}`);
    if (issues.length > 0) {
      console.log('Summary of issues:\n', JSON.stringify(issues, null, 2));
    }
  } finally {
    proc.kill();
  }
}

run().catch(console.error);
