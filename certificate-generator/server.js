const express = require('express');
const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Load environment variables from .env if present
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

// CORS & Security headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// Root route: Serve frontend certificate generator UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API: Generate High-Resolution Vector PDF Certificate
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const studentName = (req.body.studentName || 'Student Name').trim();
    const year = new Date().getFullYear();
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const certId = (req.body.certId || `RBT-WS-${year}-${randSuffix}`).trim();

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

    // Create PDF in Landscape format matching template aspect ratio (4:3)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([1024, 771]);

    let image;
    try {
      image = await pdfDoc.embedJpg(imgBytes);
    } catch {
      image = await pdfDoc.embedPng(imgBytes);
    }

    // Draw full-page certificate background
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: 1024,
      height: 771,
    });

    // Embed fonts
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Calculate dynamic font size based on name length
    let fontSize = 38;
    if (studentName.length > 20) {
      fontSize = Math.max(24, 38 - (studentName.length - 20) * 0.9);
    }

    const textWidth = timesBold.widthOfTextAtSize(studentName, fontSize);
    const nameX = (1024 - textWidth) / 2;
    const nameY = 442; // Positioned directly above dotted line in PDF coordinates

    // Draw Student Name in crisp Deep Navy (#0a243d)
    page.drawText(studentName, {
      x: nameX,
      y: nameY,
      size: fontSize,
      font: timesBold,
      color: rgb(0.04, 0.14, 0.24),
    });

    // Draw Reference ID inside the official Reference ID card
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
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

// API: Verify Certificate against Official Registry
app.get('/api/verify/:id', (req, res) => {
  const certId = String(req.params.id || '').toUpperCase().trim();
  const certDbPath = path.join(__dirname, '..', 'data', 'certificates.json');

  let cert = null;
  if (fs.existsSync(certDbPath)) {
    try {
      const records = JSON.parse(fs.readFileSync(certDbPath, 'utf8'));
      cert = records.find((c) => (c.id || c.code || '').toUpperCase() === certId);
    } catch {
      // Fallback
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

// Health check
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
