<?php
// Robotree Robotics LLP - Certificate Generator Web Interface
if (isset($_GET['action']) && $_GET['action'] === 'preview') {
    $params = http_build_query([
        'name'        => $_GET['name'] ?? 'Participant Name',
        'course'      => $_GET['course'] ?? 'Autonomous Robotics & AI Engineering',
        'class'       => $_GET['class'] ?? 'Scholars & Engineering Candidates',
        'date'        => $_GET['date'] ?? date('jS F Y'),
        'time'        => $_GET['time'] ?? '11:00 AM TO 1:00 PM',
        'venue'       => $_GET['venue'] ?? 'Robotree Asansol Centre of Excellence',
        'venue2'      => $_GET['venue2'] ?? '(Sentrum Mall, 3rd Floor, Shristinagar)',
        'orientation' => $_GET['orientation'] ?? 'L',
        'size'        => $_GET['size'] ?? 'A4',
        'pages'       => $_GET['pages'] ?? '1',
        'output'      => $_GET['output'] ?? 'I',
    ]);
    header('Location: generate_certificate.php?' . $params);
    exit;
}
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Robotree Certificate Generator · FPDF Engine</title>
<style>
  :root {
    --navy: #002b66;
    --navy-dark: #030b13;
    --green: #00803c;
    --cyber-green: #78d844;
    --gold: #d4af37;
    --bg: #f4f8fc;
    --surface: #ffffff;
    --border: #c5d5ea;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--navy-dark); min-height: 100vh; }
  header { background: linear-gradient(135deg, var(--navy) 0%, var(--green) 100%); color: #fff; padding: 18px 32px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 20px rgba(0,43,102,0.25); }
  .brand-wrap { display: flex; align-items: center; gap: 16px; }
  .logo-text { font-size: 1.6rem; font-weight: 900; letter-spacing: -1px; }
  .logo-text span { color: var(--gold); }
  header h1 { font-size: 1.3rem; letter-spacing: 0.5px; font-weight: 700; }
  header .sub { font-size: 0.78rem; opacity: 0.9; margin-top: 2px; }
  .badge { display: inline-block; background: var(--cyber-green); color: var(--navy-dark); border-radius: 20px; padding: 2px 10px; font-size: 0.7rem; font-weight: 800; margin-left: 8px; vertical-align: middle; }
  .gov-tag { font-size: 0.75rem; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); padding: 4px 12px; border-radius: 999px; }

  .container { max-width: 860px; margin: 32px auto; background: var(--surface); border-radius: 12px; box-shadow: 0 8px 30px rgba(0,43,102,0.08); overflow: hidden; border: 1px solid var(--border); }
  .form-header { background: linear-gradient(90deg, var(--navy), var(--green)); padding: 20px 28px; color: white; }
  .form-header h2 { font-size: 1.15rem; display: flex; align-items: center; gap: 8px; }
  .form-header p { font-size: 0.84rem; opacity: 0.9; margin-top: 4px; }

  form { padding: 28px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .full { grid-column: 1/-1; }
  label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--navy); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
  input, select { width: 100%; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 6px; font-size: 0.95rem; transition: all 0.2s; background: #fbfdff; color: var(--navy-dark); }
  input:focus, select:focus { outline: none; border-color: var(--green); background: #fff; box-shadow: 0 0 0 3px rgba(0,128,60,0.12); }
  .tip { font-size: 0.75rem; color: #64748b; margin-top: 4px; }

  .advanced-panel { background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-top: 10px; }
  .advanced-panel h4 { font-size: 0.82rem; color: var(--navy); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }

  .btn-row { display: flex; gap: 14px; margin-top: 24px; }
  .btn { padding: 12px 28px; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; display: inline-flex; align-items: center; gap: 8px; }
  .btn-primary { background: linear-gradient(135deg, var(--navy), var(--green)); color: white; }
  .btn-download { background: linear-gradient(135deg, var(--gold), #b8930a); color: #000; }
  .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.16); }

  .preview-box { background: var(--bg); border-top: 3px solid var(--navy); padding: 24px 28px; }
  .preview-box h3 { font-size: 0.92rem; color: var(--navy); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; justify-content: space-between; }
  iframe { width: 100%; height: 560px; border: none; border-radius: 8px; box-shadow: 0 4px 18px rgba(0,43,102,0.12); background: #fff; }

  footer { text-align: center; padding: 20px; font-size: 0.82rem; color: #64748b; background: #edf2f7; border-top: 1px solid #e2e8f0; line-height: 1.6; }
  .footer-protocol { font-weight: 600; color: var(--navy); }
</style>
</head>
<body>
<header>
  <div class="brand-wrap">
    <div class="logo-text">R<span>O</span>BOTREE</div>
    <div>
      <h1>Certificate Generator <span class="badge">FPDF Engine v2.1</span></h1>
      <div class="sub">Official Certificate of Participation &amp; Competency Accreditation</div>
    </div>
  </div>
  <div class="gov-tag">&#127470;&#127475; GeM &amp; MSME Accredited Entity</div>
</header>

<div class="container">
  <div class="form-header">
    <h2>&#127942; Generate Accredited Certificate</h2>
    <p>Fill in candidate credentials, customize orientation and transcript options, then preview or download the high-resolution vector PDF.</p>
  </div>

  <form id="certForm" method="GET" action="generate_certificate.php" target="certPreview" onsubmit="return false;">
    <input type="hidden" name="output" id="outputMode" value="I">
    <div class="grid">
      <div class="full">
        <label>Participant / Student Full Name *</label>
        <input type="text" name="name" id="name" value="Arjun Sharma" required placeholder="Enter full name">
        <div class="tip">Renders in prominent bold typography with vector dashed accent borders.</div>
      </div>

      <div>
        <label>Course / Curriculum Title *</label>
        <input type="text" name="course" id="course" value="Autonomous Robotics & AI Engineering" required>
      </div>

      <div>
        <label>Class / Target Audience</label>
        <input type="text" name="class" id="class" value="Scholars & Engineering Candidates">
      </div>

      <div>
        <label>Accreditation Date *</label>
        <input type="text" name="date" id="date" value="26th July, 2026" required placeholder="e.g. 26th July, 2026">
      </div>

      <div>
        <label>Session Schedule &amp; Hours</label>
        <input type="text" name="time" id="time" value="11:00 AM TO 1:00 PM">
      </div>

      <div>
        <label>Training Venue</label>
        <input type="text" name="venue" id="venue" value="Robotree Asansol Centre of Excellence">
      </div>

      <div>
        <label>Venue Sub-Location / City</label>
        <input type="text" name="venue2" id="venue2" value="(Sentrum Mall, 3rd Floor, Shristinagar)">
      </div>

      <div class="full advanced-panel">
        <h4>&#9881; Advanced FPDF Layout &amp; Page Options</h4>
        <div class="grid">
          <div>
            <label>Design Template Style</label>
            <select name="template" id="template">
              <option value="vector" selected>Pure Vector Master (Guilloche &amp; Rosette Seal)</option>
              <option value="official">Official High-DPI Workshop Graphic Template</option>
            </select>
          </div>
          <div>
            <label>Page Orientation (AddPage)</label>
            <select name="orientation" id="orientation">
              <option value="L" selected>Landscape (Standard Diploma 297x210 mm)</option>
              <option value="P">Portrait (Executive Frame 210x297 mm)</option>
            </select>
          </div>
          <div>
            <label>Paper Size</label>
            <select name="size" id="size">
              <option value="A4" selected>A4 (ISO Standard)</option>
              <option value="LETTER">US Letter</option>
            </select>
          </div>
          <div>
            <label>Multi-Page Document Mode (AcceptPageBreak)</label>
            <select name="pages" id="pages">
              <option value="1" selected>Single-Page: Official Award Certificate</option>
              <option value="2">Two-Page: Certificate + Competency Transcript</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="btn-row">
      <button type="button" class="btn btn-primary" onclick="previewCert()">&#128065; Preview Vector PDF</button>
      <button type="button" class="btn btn-download" onclick="downloadCert()">&#11123; Download PDF</button>
    </div>
  </form>

  <div class="preview-box" id="previewSection" style="display:none;">
    <h3>
      <span>&#128196; Real-Time PDF Preview</span>
      <span style="font-size:0.75rem; font-weight:normal; color:#64748b;">Powered by FPDF Vector Renderer</span>
    </h3>
    <iframe name="certPreview" id="certPreview" src="about:blank" title="Certificate Preview"></iframe>
  </div>
</div>

<footer>
  <p class="footer-protocol">Robotree Robotics LLP &bull; Operating in accordance with Government of India Protocols (GeM &amp; MSME Accredited Entity)</p>
  <p style="margin-top: 4px;">High-Precision PDF Certificate Generator &bull; Powered by FPDF Engine &bull; Zero Commercial Copyright</p>
</footer>

<script>
function getParams(mode) {
  return new URLSearchParams({
    output:      mode,
    name:        document.getElementById('name').value,
    course:      document.getElementById('course').value,
    class:       document.getElementById('class').value,
    date:        document.getElementById('date').value,
    time:        document.getElementById('time').value,
    venue:       document.getElementById('venue').value,
    venue2:      document.getElementById('venue2').value,
    template:    document.getElementById('template').value,
    orientation: document.getElementById('orientation').value,
    size:        document.getElementById('size').value,
    pages:       document.getElementById('pages').value,
  }).toString();
}

function previewCert() {
  document.getElementById('previewSection').style.display = 'block';
  document.getElementById('certPreview').src = 'generate_certificate.php?' + getParams('I');
  setTimeout(() => document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth' }), 200);
}

function downloadCert() {
  window.open('generate_certificate.php?' + getParams('D'), '_blank');
}
</script>
</body>
</html>
