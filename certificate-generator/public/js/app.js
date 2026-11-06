/* ==========================================================================
   Robotree Student Certificate Generator - Client-Side App
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('certCanvas');
  const ctx = canvas.getContext('2d');

  const nameInput = document.getElementById('studentName');
  const certIdInput = document.getElementById('certId');
  const fontOptions = document.querySelectorAll('.font-option');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const printBtn = document.getElementById('printBtn');
  const statusBadge = document.getElementById('statusBadge');
  const adminGuard = document.getElementById('adminAuthGuard');

  function getAdminToken() {
    try {
      return localStorage.getItem('robotree_admin_token') ||
             sessionStorage.getItem('robotree_admin_token') ||
             localStorage.getItem('adminToken') ||
             sessionStorage.getItem('adminToken') || '';
    } catch {
      return '';
    }
  }

  const initialToken = getAdminToken();
  if (!initialToken && adminGuard) {
    adminGuard.style.display = 'flex';
  }

  let currentFont = 'Great Vibes';
  let templateImg = new Image();
  templateImg.src = '/certificate.jpeg';

  function generateCertCode() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    return `RBT-WS-${year}-${randomNum}`;
  }

  if (certIdInput && (!certIdInput.value || certIdInput.value === 'RBT-WS-2026-4821' || certIdInput.value === 'RBT-WS-2026-0001')) {
    certIdInput.value = generateCertCode();
  }

  templateImg.onload = () => {
    // 2x high-resolution canvas for retina sharpness
    canvas.width = (templateImg.naturalWidth || 791) * 2;
    canvas.height = (templateImg.naturalHeight || 596) * 2;
    renderCertificate();
  };

  templateImg.onerror = () => {
    // Fallback to png if jpeg format mismatch occurs
    templateImg.src = '/certificate.png';
  };

  function renderCertificate() {
    if (!templateImg.complete) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Draw base certificate template
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(templateImg, 0, 0, w, h);

    const studentName = (nameInput.value || 'Student Name').trim();
    const certId = (certIdInput.value || 'RBT-WS-2026-0001').trim();

    // 2. Render Student Name above the dotted line
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let fontSize = 72;
    if (studentName.length > 22) {
      fontSize = Math.max(42, 72 - (studentName.length - 22) * 1.6);
    }

    if (currentFont === 'Great Vibes') {
      ctx.font = `600 ${fontSize * 1.3}px 'Great Vibes', cursive`;
      ctx.fillStyle = '#0a2238';
    } else if (currentFont === 'Playfair Display') {
      ctx.font = `700 ${fontSize * 0.95}px 'Playfair Display', serif`;
      ctx.fillStyle = '#0b233a';
    } else if (currentFont === 'Cinzel') {
      ctx.font = `800 ${fontSize * 0.85}px 'Cinzel', serif`;
      ctx.fillStyle = '#0b233a';
    } else {
      ctx.font = `800 ${fontSize}px 'Montserrat', sans-serif`;
      ctx.fillStyle = '#0a1f33';
    }

    const nameX = w / 2;
    const nameY = h * 0.458; // Perfectly sits on top of dotted line

    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 3;

    ctx.fillText(studentName, nameX, nameY);
    ctx.restore();

    // 3. Render Certificate ID watermark in bottom right corner
    ctx.save();
    ctx.font = "600 20px 'Inter', sans-serif";
    ctx.fillStyle = 'rgba(15, 43, 72, 0.85)';
    ctx.textAlign = 'right';
    ctx.fillText(`ID: ${certId}`, w - 40, h - 30);
    ctx.restore();
  }

  // Real-time live typing preview
  nameInput.addEventListener('input', renderCertificate);
  certIdInput.addEventListener('input', renderCertificate);

  // Auto-generate random verification code button
  const btnAutoGenerateCode = document.getElementById('btnAutoGenerateCode');
  if (btnAutoGenerateCode) {
    btnAutoGenerateCode.addEventListener('click', () => {
      if (certIdInput) {
        certIdInput.value = generateCertCode();
        renderCertificate();
        certIdInput.focus();
      }
    });
  }

  // Font style switch
  fontOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      fontOptions.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFont = btn.dataset.font;
      renderCertificate();
    });
  });

  // Client-side Instant PNG Image Download
  downloadPngBtn.addEventListener('click', () => {
    const token = getAdminToken();
    if (!token) {
      if (adminGuard) adminGuard.style.display = 'flex';
      alert('Access Denied: Only administrators are authorized to generate certificates.');
      return;
    }

    const studentName = (nameInput.value || 'Student').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const link = document.createElement('a');
    link.download = `Robotree_Workshop_Certificate_${studentName}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    
    if (statusBadge) {
      statusBadge.textContent = '✓ PNG Certificate Downloaded';
      setTimeout(() => { statusBadge.textContent = '● Live Preview Active'; }, 3000);
    }
  });

  // Server-side High-Res Vector PDF Download
  downloadPdfBtn.addEventListener('click', async () => {
    const token = getAdminToken();
    if (!token) {
      if (adminGuard) adminGuard.style.display = 'flex';
      alert('Access Denied: Only administrators are authorized to generate certificates.');
      return;
    }

    const studentName = (nameInput.value || 'Student').trim();
    const certId = (certIdInput.value || 'RBT-WS-2026-0001').trim();

    downloadPdfBtn.disabled = true;
    const origHtml = downloadPdfBtn.innerHTML;
    downloadPdfBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      Generating PDF...
    `;

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentName, certId, fontStyle: currentFont }),
      });

      if (response.status === 401 || response.status === 403) {
        if (adminGuard) adminGuard.style.display = 'flex';
        alert('Access Denied: Only system administrators are authorized to generate certificates.');
        return;
      }

      if (!response.ok) throw new Error('PDF Generation failed on server');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanName = studentName.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.href = url;
      link.download = `Robotree_Workshop_Certificate_${cleanName}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      if (statusBadge) {
        statusBadge.textContent = '✓ PDF Certificate Downloaded';
        setTimeout(() => { statusBadge.textContent = '● Live Preview Active'; }, 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to generate certificate.');
    } finally {
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.innerHTML = origHtml;
    }
  });

  // Direct Print Support
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      const token = getAdminToken();
      if (!token) {
        if (adminGuard) adminGuard.style.display = 'flex';
        alert('Access Denied: Only administrators are authorized to generate certificates.');
        return;
      }

      const dataUrl = canvas.toDataURL('image/png');
      const win = window.open('', '_blank');
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Certificate - Robotree Robotics</title>
            <style>
              @page { size: landscape; margin: 0; }
              body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
              img { width: 100%; height: 100%; object-fit: contain; }
            </style>
          </head>
          <body onload="window.print();window.close();">
            <img src="${dataUrl}" />
          </body>
        </html>
      `);
      win.document.close();
    });
  }
});
