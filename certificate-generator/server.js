const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('node:crypto');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      if (k && v.length > 0 && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').trim();
      }
    }
  });
}

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'https://robotree.in',
  'https://www.robotree.in',
];
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_ORIGINS);

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;

function getClientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

function rateLimiter(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => t > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Request limit exceeded. Please try again later.',
    });
    return;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  next();
}

setInterval(() => {
  const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter((t) => t > windowStart);
    if (valid.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, valid);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

app.disable('x-powered-by');

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin) ||
    (origin && /\.vercel\.app$/.test(new URL(origin).hostname));
  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  const csp = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
  if (IS_PRODUCTION) {
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  } else {
    res.setHeader('Content-Security-Policy', csp);
  }
  next();
});

app.use(rateLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized', message: 'Admin authentication required.' });
    return;
  }
  if (ADMIN_PASSCODE) {
    const expected = crypto.createHash('sha256').update(ADMIN_PASSCODE).digest('hex');
    const provided = crypto.createHash('sha256').update(token).digest('hex');
    if (
      token.length < 8 ||
      !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
    ) {
      res.status(403).json({ success: false, error: 'Forbidden', message: 'Invalid admin token.' });
      return;
    }
  }
  next();
}

app.post('/api/generate-pdf', requireAdminAuth, async (req, res) => {
  try {
    const studentName = String((req.body.studentName || 'Student Name')).trim().slice(0, 120);
    const year = new Date().getFullYear();
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const certId = String((req.body.certId || `RBT-WS-${year}-${randSuffix}`)).trim().slice(0, 64);

    const templateJpeg = path.join(__dirname, 'public', 'certificate.jpeg');
    const templatePng = path.join(__dirname, 'public', 'certificate.png');

    let imgBytes;

    if (fs.existsSync(templateJpeg)) {
      imgBytes = fs.readFileSync(templateJpeg);
    } else if (fs.existsSync(templatePng)) {
      imgBytes = fs.readFileSync(templatePng);
    } else {
      return res.status(500).json({ error: 'Certificate template asset not found' });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([1024, 771]);

    let image;
    try {
      image = await pdfDoc.embedJpg(imgBytes);
    } catch {
      image = await pdfDoc.embedPng(imgBytes);
    }

    page.drawImage(image, {
      x: 0,
      y: 0,
      width: 1024,
      height: 771,
    });

    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let fontSize = 38;
    if (studentName.length > 20) {
      fontSize = Math.max(24, 38 - (studentName.length - 20) * 0.9);
    }

    const textWidth = timesBold.widthOfTextAtSize(studentName, fontSize);
    const nameX = (1024 - textWidth) / 2;
    const nameY = 442;

    page.drawText(studentName, {
      x: nameX,
      y: nameY,
      size: fontSize,
      font: timesBold,
      color: rgb(0.04, 0.14, 0.24),
    });

    page.drawRectangle({
      x: 550,
      y: 50,
      width: 190,
      height: 18,
      color: rgb(0.96, 0.97, 0.97),
    });

    const idFontSize = 11.5;
    const idText = certId;
    const idWidth = regularFont.widthOfTextAtSize(idText, idFontSize);
    page.drawText(idText, {
      x: 550 + (190 - idWidth) / 2,
      y: 54,
      size: idFontSize,
      font: regularFont,
      color: rgb(0.04, 0.14, 0.24),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    const safeFilename = `Robotree_Workshop_Certificate_${studentName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Server PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

app.get('/api/verify/:id', (req, res) => {
  const certId = String(req.params.id || '').toUpperCase().trim().slice(0, 64);
  const certDbPath = path.join(__dirname, '..', 'data', 'certificates.json');

  let cert = null;
  if (fs.existsSync(certDbPath)) {
    try {
      const records = JSON.parse(fs.readFileSync(certDbPath, 'utf8'));
      cert = records.find((c) => (c.id || c.code || '').toUpperCase() === certId);
    } catch {
    }
  }

  if (cert) {
    return res.json({
      valid: true,
      certificateId: cert.id || cert.code,
      studentName: cert.studentName || cert.candidateName,
      course: cert.courseTitle || cert.courseName,
      organization: 'Robotree Robotics LLP',
      workshop: cert.courseTitle || cert.courseName || 'Robotics & STEM Workshop',
      date: cert.issueDate || '2026-07-26',
      venue: cert.venue || 'Sentrum Mall, 3rd Floor, Shristinagar, Asansol',
      certifiedBy: ['Rishav Ranjan (CEO)', 'Rahul Kumar Singh (Director)']
    });
  }

  res.status(404).json({
    valid: false,
    error: 'Not Found',
    message: 'Certificate ID not found in official accreditation registry.',
    certificateId: certId
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Robotree Certificate Generator' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`Robotree Certificate Generator Service Running`);
    console.log(`Server URL: http://localhost:${PORT}`);
    console.log(`Template: public/certificate.jpeg (Ready)`);
    console.log('====================================================');
  });
}

module.exports = app;
