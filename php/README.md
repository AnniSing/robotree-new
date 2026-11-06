# Robotree Enterprise PHP Certificate Generator (FPDF Engine)

Generate authentic, high-resolution, vector-accurate **Certificates of Participation & Accreditation** as PDF documents using FPDF (standalone, zero Composer dependencies).

Operating strictly in accordance with **Government of India Protocols** (GeM & MSME Accredited Entity).

---

## 01. Architecture & Key FPDF Capabilities

| FPDF Method | Implementation Details |
|:---|:---|
| **`AddPage($orientation, $size)`** | Dynamic layout calculation supporting both **Landscape (`L`)** (297x210 mm) and **Portrait (`P`)** (210x297 mm) on **A4** and **US Letter**. |
| **`AddFont($family, $style, $file)`** | Custom font loader (`SafeAddFont`) that loads custom TrueType font definitions (e.g. `Cinzel`, `Montserrat`, `Roboto`) with graceful fallback to core fonts (`Times`, `Helvetica`). |
| **`AcceptPageBreak()`** | Custom lifecycle handler preventing accidental page spillovers on single-page certificates while cleanly managing multi-page academic transcripts. |
| **`SetDash($black, $white)`** | Native PDF vector graphic line-dashing operator for professional accent borders. |

---

## 02. File Structure

```
php/
├── fpdf/
│   └── fpdf.php               # Standalone FPDF 1.86 core library
├── fonts/                     # Directory for custom FPDF font definition files
├── generate_certificate.php   # Enterprise certificate & transcript generation engine
├── index.php                  # Interactive web UI with live PDF preview
└── README.md                  # This documentation guide
```

---

## 03. Quick Start

### Option A: PHP Built-in Server (Local)
From the project root:
```bash
php -S localhost:8080 -t php
```
Then visit: `http://localhost:8080/index.php`

### Option B: Apache / XAMPP
Copy the `php/` folder into your `htdocs/robotree/` directory and open:
`http://localhost/robotree/index.php`

---

## 04. URL Parameters & Query Reference

| Parameter | Default | Options | Description |
|:---|:---|:---|:---|
| `name` | `Participant Name` | String | Full name of the candidate / scholar. |
| `course` | `Autonomous Robotics & AI Engineering` | String | Course or curriculum title. |
| `class` | `Scholars & Engineering Candidates` | String | Target audience or class cohort. |
| `date` | Current Date | String | Official date of issuance. |
| `time` | `11:00 AM TO 1:00 PM` | String | Workshop schedule or lab training hours. |
| `venue` | `Robotree Asansol Centre of Excellence`| String | Authorized venue name. |
| `venue2` | `(Sentrum Mall, 3rd Floor...)` | String | Sub-location / city detail. |
| `orientation`| `L` | `L` (Landscape), `P` (Portrait) | Page orientation. |
| `size` | `A4` | `A4`, `LETTER` | Paper size. |
| `pages` | `1` | `1` (Single), `2` (With Transcript)| Document mode. |
| `output` | `I` | `I` (Inline), `D` (Download), `S` (Base64), `F` (File) | PDF output delivery mode. |
| `file` | Auto-generated | String | Target file path when `output=F`. |

---

## 05. CLI Execution Examples

### Single-Page Landscape Certificate:
```bash
php php/generate_certificate.php --name="Arjun Sharma" --course="Autonomous Robotics" --orientation=L --output=F --file=cert.pdf
```

### Two-Page Certificate + Official Competency Transcript:
```bash
php php/generate_certificate.php --name="Priya Patel" --course="Drone & AI Engineering" --orientation=L --pages=2 --output=F --file=full_credential.pdf
```

---

## 06. Regulatory & Accreditation Statement

Robotree Robotics LLP operates strictly in accordance with **Government of India Protocols** under GeM (Government e-Marketplace) and MSME accreditation. All commercial copyright notices have been permanently removed from certificate templates and web headers in favor of official accreditation notices.
