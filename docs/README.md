# Robotree Documentation Hub (README)

Welcome to the comprehensive engineering and architecture documentation for the **Robotree Robotics Corporate & STEM Education Web Platform** (GeM & MSME Accredited Entity).

---

## 01. Documentation Index

This directory contains the complete technical and operational documentation suite:

| Document | File Name | Primary Purpose |
|:---|:---|:---|
| **Product Requirements** | [`PRD.md`](./PRD.md) | High-level product vision, personas, user journeys, functional and non-functional requirements. |
| **Technical Requirements** | [`TRD.md`](./TRD.md) | System specifications, technology stack, security constraints, integrations, and architectural objectives. |
| **Application Flow** | [`APP_FLOW.md`](./APP_FLOW.md) | Screen-by-screen navigation hierarchy, user decision diagrams, sub-flows, and state diagrams. |
| **Implementation Plan** | [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) | Phased engineering delivery roadmap, completed milestones, verification criteria, and post-launch plans. |
| **Backend Schema** | [`BACKEND_SCHEMA.md`](./BACKEND_SCHEMA.md) | Domain models, JSON storage layouts, relational PostgreSQL DDL schemas, and repository interfaces. |
| **Testing Guide** | [`TESTING.md`](./TESTING.md) | QA methodology, 22-test automated test matrix, smoke scripts, checklists, and execution commands. |
| **Autonomous Agents** | [`AGENTS.md`](./AGENTS.md) | Guidelines and behavioral rules for AI coding assistants and autonomous engineering agents. |
| **Design System** | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Design tokens, color palette, typography hierarchy, component patterns, and accessibility guidelines. |
| **System Architecture** | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Deep dive into the Enterprise MVC + Services architecture, layers, data flow, and error taxonomy. |
| **Security Model** | [`SECURITY.md`](./SECURITY.md) | OWASP mitigation, CSRF double-submit token pattern, Argon2id auth, audit logging, and compliance. |
| **Code Style Guide** | [`CODE_STYLE.md`](./CODE_STYLE.md) | TypeScript style rules, naming conventions, separation of concerns, and git commit standards. |

---

## 02. Architecture At A Glance

The backend strictly implements the industry-standard **MVC + Services** pattern:

```
HTTP Request
     │
     ▼
[routes/v1/] ────► [middleware/] (CSRF, Auth, Security Headers, Rate Limit)
                         │
                         ▼
                [controllers/] (Thin HTTP Orchestration Layer)
                         │
                         ▼
                [services/] (Business Logic, Validation, Telemetry)
                         │
                         ▼
                [repositories/] (Abstracted Data Access Layer)
                         │
                         ▼
                [data/ or PostgreSQL] (Persistence Layer)
```

---

## 03. Quickstart & Local Development

### Prerequisites
- Node.js v20.x or higher
- npm v10.x or higher

### 1. Install Dependencies
```powershell
npm install
```

### 2. Compile TypeScript Backend
```powershell
npm run backend:build
```

### 3. Run Automated Tests
```powershell
npm test
```

### 4. Start Local Servers
- **Backend API Server (port 5000):**
  ```powershell
  node server.js
  ```
- **Frontend Dev Server (port 3000):**
  ```powershell
  npm run dev
  ```

---

## 04. Operational Endpoints & Passcodes

- **Frontend Portal:** `http://localhost:3000`
- **Backend Health Check:** `http://localhost:5000/api/health`
- **Public Site Settings:** `http://localhost:5000/api/site-settings`
- **Admin Portal:** `http://localhost:3000/admin.html`
- **Admin Passcode:** `Anni4515` (configured in `data/settings.json`)

---

## 05. Standalone PHP & FPDF Certificate Toolkit

For offline or PHP-based deployment environments, the platform includes a complete FPDF certificate suite in [`php/`](../php):
- **Core Engine:** [`php/FPDFCertificate.php`](../php/FPDFCertificate.php) with official extensions (`RoundedRect`, `SetDash`, `Rotate`, `SetAlpha`, `LinearGradient`, `FitTextCell`, `DrawGuillocheWave`, `DrawRosetteSeal`, `DrawVectorQRCodeMatrix`).
- **Generator:** [`php/generate_certificate.php`](../php/generate_certificate.php) with dual-mode support (Landscape `L` / Portrait `P`, Single-Page / Two-Page Competency Transcript).
- **Web Interface:** [`php/index.php`](../php/index.php) with interactive form controls and real-time PDF preview iframe.
- **Font Utilities:** [`php/makefont/makefont.php`](../php/makefont/makefont.php) and [`php/makefont/ttfparser.php`](../php/makefont/ttfparser.php) for compiling custom TrueType / OpenType fonts.

---

## 06. Regulatory & Accreditation Statement

Operating strictly in accordance with **Government of India Protocols** under GeM (Government e-Marketplace) and MSME accreditation. All commercial copyright notices have been permanently replaced with official accreditation declarations.
