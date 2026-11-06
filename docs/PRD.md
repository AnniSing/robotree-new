# Product Requirements Document (PRD)

**Product Name:** Robotree Robotics Corporate & STEM Education Web Platform  
**Document Version:** 2.1.0  
**Status:** Approved & Implemented  
**Entity:** Robotree Robotics LLP (GeM & MSME Accredited Entity)  
**Author:** Senior Technical Product Engineering Team  

---

## 01. Executive Summary & Vision

### 1.1 Product Vision
Robotree Robotics LLP is a premier robotics training and technology development entity recognized under the Government of India protocols (GeM and MSME accredited). The platform serves as the central digital hub for school students (Grades 1-12), university engineering scholars, faculty educators, and institutional leadership (JNV, KVS, NITs, DPS, DAV).

The primary vision is to provide:
1. An immersive, lightning-fast digital portal to explore, enroll in, and inquire about 9 specialized technical domains (Robotics, AI, IoT, Drones, 3D Printing, Cyber Security, Space Tech, and Web Development).
2. A cryptographic, verifiable Certificate Accreditation Engine for institutional partners and learners.
3. An enterprise Turnkey STEM & AI Lab Consultation request pipeline.
4. A secure, administrative operations portal for live content governance, lead management, and platform telemetry.

### 1.2 Strategic Goals
- **Lead Generation:** Increase qualified institutional and student leads through streamlined consultation forms and newsletter opt-ins.
- **Credential Integrity:** Offer 100% instant verification of issued certificates to eliminate credential forgery.
- **Administrative Agility:** Enable non-technical administrators to update key operational metrics (e.g. students trained, active labs) and legal compliance notices in real time without code deployment.
- **Compliance:** Full adherence to Government of India protocols, GeM procurement guidelines, and privacy regulations (GDPR/DPDP compliance).

---

## 02. User Personas & Stakeholders

| Persona | Demographics & Context | Primary Goals | Key Touchpoints |
|:---|:---|:---|:---|
| **School Student & Parent** | Grade 1-12 students, parents seeking STEM skills | Discover practical robotics workshops, view fee structures, request callbacks | Course catalog, inquiry modal, WhatsApp chat link |
| **Engineering / College Scholar** | Undergraduate engineering students | Enroll in specialized drone/AI/IoT internships, earn industry credentials | Course curriculum, Razorpay checkout, certificate verification |
| **School Principal / Administrator** | Institutional leaders (KVS, JNV, private schools) | Procure turnkey ATL / Robotics labs, book faculty training | Turnkey lab service page, institutional partner showcase, B2B contact form |
| **Corporate HR / Training Lead** | Technology enterprises, CSR foundations | Sponsor student cohorts, organize corporate robotics hackathons | Services page, corporate inquiry channel |
| **System Administrator** | Robotree executive staff & operations lead | Manage leads, verify student records, update live homepage stats | Protected Admin Portal (`/admin.html`), site settings editor |

---

## 03. Functional Requirements

### 3.1 Course Prospectus & Curriculum Exploration
- **FR-1.1:** Display 9 specialized training programs with duration, fee, curriculum highlights, and skill level badges.
- **FR-1.2:** Dynamic filtering by domain (Robotics, AI & ML, IoT, Drones & Aviation, 3D Design, Space Tech).
- **FR-1.3:** Instant modal preview for detailed syllabus outlines and equipment kits provided.
- **FR-1.4:** Dual call-to-action per course: "Enroll Now" (payment flow) and "Download Prospectus" / "Inquire" (lead flow).

### 3.2 Certificate Verification Portal
- **FR-2.1:** Instant certificate search by unique ID (e.g., `RRT-2026-ROB-001`).
- **FR-2.2:** Real-time modal displaying recipient name, course completed, issue date, grade, verification status, and digital badge.
- **FR-2.3:** Client-side HTML5 Canvas rendering for high-resolution certificate generation and PNG/PDF download.
- **FR-2.4:** Fallback QR-code verification link resolving directly to verification endpoint.

### 3.3 Institutional Turnkey Lab & Service Showcases
- **FR-3.1:** Dedicated presentation of lab setup offerings: Atal Tinkering Labs (ATL), Advanced AI & Robotics Labs, Drone Aviation Labs.
- **FR-3.2:** Showcase accredited institutional partners (NIT Arunachal Pradesh, NIT Jamshedpur, Kendriya Vidyalayas, Jawahar Navodaya Vidyalayas, DPS, DAV).
- **FR-3.3:** Interactive consultation request form with school name, student capacity, budget range, and timeline.

### 3.4 Leadership & Educator Directory
- **FR-4.1:** Dynamic team grid populated via API endpoint (`/api/team`).
- **FR-4.2:** Filterable roles: Leadership, Engineering Leads, STEM Instructors, Research Mentors.
- **FR-4.3:** Individual bios, academic credentials, and social links (LinkedIn, GitHub).

### 3.5 Dynamic Site Settings & Admin Operations
- **FR-5.1:** Passcode-protected administrative portal with CSRF and rate-limit defenses.
- **FR-5.2:** Real-time editing of the hero floating badge metric (e.g., `20,000+` and `Students Trained`).
- **FR-5.3:** Real-time editing of the Government Protocol compliance notice in page footers.
- **FR-5.4:** Live dashboard metrics: total inquiries, newsletter subscribers, verified certificates, and recent audit logs.
- **FR-5.5:** One-click CSV export of inquiries and newsletter contacts.

### 3.6 Legal & Compliance Notice
- **FR-6.1:** Complete absence of proprietary copyright claims in favor of the official Government Protocol accreditation notice.
- **FR-6.2:** Mandatory GDPR/DPDP-compliant cookie consent banner with granular preferences.
- **FR-6.3:** Accessible privacy policy and terms of service modals.

---

## 04. Non-Functional Requirements (NFR)

### 4.1 Performance & Core Web Vitals
- **Lighthouse Scores:** 90+ across Performance, Accessibility, Best Practices, and SEO.
- **First Contentful Paint (FCP):** < 1.2 seconds.
- **Largest Contentful Paint (LCP):** < 2.0 seconds on 4G networks.
- **Cumulative Layout Shift (CLS):** < 0.05.
- **Time to Interactive (TTI):** < 2.5 seconds.

### 4.2 Security & Data Integrity
- **Authentication:** Admin authentication secured via argon2id password hashing and session tokens.
- **CSRF Defense:** Double-submit cookie pattern with cryptographic tokens required on all mutating API calls (`POST`, `PUT`, `DELETE`).
- **Input Sanitization:** Strict Zod schema validation and XSS HTML sanitization on all user inputs.
- **HTTP Hardening:** Full suite of security headers (CSP, HSTS `max-age=63072000`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

### 4.3 Reliability & High Availability
- **Graceful Degradation:** Resilient fallback to cached state when third-party APIs (e.g. Razorpay) are unreachable.
- **Persistence Storage:** Dual-mode repository abstraction (JSON atomic file persistence for zero-dependency local execution; PostgreSQL for scaled production).

### 4.4 Accessibility (a11y)
- **Compliance:** WCAG 2.1 Level AA conformance.
- **Keyboard Navigation:** 100% reachable interactive elements with visible focus rings (`:focus-visible`).
- **Screen Reader Support:** Semantic HTML5 (`<main>`, `<nav>`, `<article>`, `<aside>`, `<footer>`) with descriptive `aria-*` tags.

---

## 05. Success Metrics & Key Performance Indicators (KPIs)

| KPI Metric | Baseline Target | Measurement Method |
|:---|:---|:---|
| **Lead Conversion Rate** | > 4.5% of total unique visitors | Form submissions / Unique site sessions |
| **Certificate Verification Speed** | < 300 ms response time | Server telemetry on `/api/certificates/verify/:id` |
| **Site Performance Score** | $\ge 95$ on desktop, $\ge 90$ on mobile | Google Lighthouse Audits |
| **Zero Security Vulnerabilities** | 0 critical/high findings | Automated `npm audit` and static security scanning |
| **System Uptime** | 99.9% availability | Production health monitor polling `/api/health` |
