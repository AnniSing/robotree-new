# 📘 Product Requirements Document (PRD)
## Project: Robotree Robotics LLP Official Web Platform & Administrative Portal
**Document Version:** `1.0.0 (Enterprise Production Edition)`  
**Organization:** Robotree Robotics LLP  
**Accreditation:** ISO 9001:2015 Certified EdTech & Robotics Institution  
**Status:** Released & Fully Operational  

---

## 1. Executive Summary & Product Vision

### 1.1 Product Overview
The **Robotree Robotics LLP Web Platform** is an enterprise-grade digital ecosystem designed to showcase the organization's nationwide leadership in Robotics, Artificial Intelligence, IoT, Drone Technology, and Turnkey STEM Innovation Labs.

The platform serves as both a **public-facing institutional hub** (for students, colleges, schools, and enterprise partners) and a **secure administrative control center** (for managing personnel directories, course curricula, multi-photo event galleries, certificate verification, and institutional inquiries).

### 1.2 Core Business Objectives
1. **Institutional Credibility & Trust:** Deliver an authoritative, modern, and ISO 9001:2015 accredited online presence for academic tie-ups with premier institutions (e.g., NIT Arunachal Pradesh, NIT Jamshedpur, Asansol Engineering College, Kendriya Vidyalayas, JNVs, DAV Model Schools).
2. **Interactive Student & Partner Engagement:** Provide self-service tools including instant certificate verification with cryptographic codes, interactive course syllabus exploration, multi-photo sliding event galleries, and geolocation distance calculations.
3. **Robust Security & Data Protection:** Enforce OWASP Top 10 security standards, CSRF Double-Submit token validation, GDPR Data Subject Rights (Data Export & Account Erasure), authoritative server-side pricing, and brute-force protection.
4. **Autonomous Administration:** Empower non-technical administrators with a zero-friction portal to manage courses, 17-member team directory, media assets, inquiries, and certificate issuance/revocation.

---

## 2. Target User Personas & Stakeholders

| Persona | Role & Description | Primary Goals & Workflows |
| :--- | :--- | :--- |
| **School & College Students** | K-12 and undergraduate engineering learners | Browse robotics courses, register/login, verify earned workshop certificates, download official PDF diplomas, view event galleries. |
| **Academic Leadership (Principals / TPOs / HODs)** | Decision-makers at partner institutions | Explore Turnkey STEM Lab setup offerings, submit institutional inquiry requests, check ISO certifications, verify trainer credentials. |
| **Trainers & Faculty Members** | Certified master trainers & STEM mentors | Access course curriculums, review scheduled workshops, share achievements and profile details. |
| **System Administrator / Executive Staff** | Internal administrative team | Authenticate with secure passcodes, issue/revoke accredited certificates, manage 17 team profiles, upload multi-photo event media, monitor diagnostics. |

---

## 3. System Architecture & Technology Stack

```
                               ┌──────────────────────────────────────────────┐
                               │               Client Tier                    │
                               │  (Responsive HTML5 / CSS3 / ES Modules)       │
                               └──────────────────────┬───────────────────────┘
                                                      │ HTTPS / Same-Origin
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │           Vite Bundler & Asset Pipeline      │
                               │   (Minification, CSS Var, Tree Shaking)      │
                               └──────────────────────┬───────────────────────┘
                                                      │ REST API Calls + CSRF Header
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │            Express.js Application Layer      │
                               │  - Security Headers (Helmet, CSP, CORS)      │
                               │  - CSRF Double-Submit Cookie Guard           │
                               │  - Constant-Time Admin Authentication         │
                               │  - Rate Limiting & Input Sanitizers          │
                               └──────────────────────┬───────────────────────┘
                                                      │ Atomic File Ops / In-Memory Cache
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │      ACID-Safe JSON Persistence Engine       │
                               │  - users.json        - team.json (17)        │
                               │  - courses.json      - events-gallery.json   │
                               │  - certificates.json - activities.json       │
                               └──────────────────────────────────────────────┘
```

### 3.1 Technology Matrix
- **Frontend Core:** Semantic HTML5, Custom CSS3 Architecture (Dark/Light Theme CSS variables, Glassmorphic Modals, Touch Swipe gesture handlers), Vanilla JavaScript (ES6+ Modules, Async/Await).
- **Build & Asset Bundler:** Vite v5 (Production pipeline, asset hash busting, Gzip optimization).
- **Backend Framework:** Node.js v20+ with Express.js REST API.
- **Persistence:** High-performance, atomic JSON File Database (`backend/src/persistence/json-database.js`) with path traversal guards and prototype pollution mitigation.
- **Security & Cryptography:** Native Node `crypto` (`timingSafeEqual`, SHA-256 password hashing with salt, high-entropy CSRF tokens).

---

## 4. Public Web Pages & Functional Modules

### 4.1 Home Hub (`index.html`)
- **Hero Showcase:** Dynamic visual banner highlighting ISO 9001:2015 accreditation, student metrics, and interactive quick CTAs.
- **Key Metrics & Statistics Bar:** Real-time counters (5000+ Students Trained, 50+ Partner Schools, 15+ Robotics Labs, 100% Practical Kits).
- **Institutional Partners Grid:** Official logos and partnership briefs for NIT AP, NIT JSR, AEC, DAV Model School, KVS, JNV.
- **Academic Testimonials:** Genuine reviews and faculty endorsements from partner school principals.
- **Unified Portal Modal:** Tabbed modal offering Student Login, New Registration, Password Reset, and Admin Passcode Access.

### 4.2 About Us (`about.html`)
- **Organizational History:** Evolution of Robotree Robotics LLP into Eastern India's leading STEM enterprise.
- **Core Pillars & Mission:** Focus on hands-on practical training, micro-controller firmware, AI robotics, and drone engineering.
- **Accreditation & Compliance:** Quality policy and ISO certification transparency.

### 4.3 Full Team Directory (`team.html`)
- **Active Personnel:** Display of all **17 verified company personnel** across 4 tier classifications:
  1. *Executive Leadership (2)*: Rahul Kumar Singh (Founder & Director), Rishav Ranjan (CEO & Co-Founder).
  2. *Lead Technical Trainers (2)*: Aditya Pandey, Deo Narayan.
  3. *Assistant Trainers (10)*: SK Ayub, Debleena Roy, Priyesh Ranjan, Ankit Kumar, Harsh Kumar, Akash Poddar, Pranab Dutta, Sonu Kr Patel, Sahil Ansari, Asif Mondal.
  4. *HR, Admin & Business Development (3)*: Sakshi Kumari, Sakina Khatoon, Jibrail Kalim.
- **Dynamic Category Filtering:** Instant multi-category tabs (`All`, `Leadership`, `Lead Trainers`, `Assistant Trainers`, `Operations`) with real-time count recalculation.
- **Instant Search:** Debounced filter by Member Name, Role, Department, or Core Skills.
- **Direct Connect Modal:** Profile card modal displaying candidate qualifications, years of experience, and a copyable email trigger.

### 4.4 Course Catalog & Tracks (`courses.html`)
- **Curriculum Offerings:** School STEM, Advanced Robotics & ROS2, AI & Machine Learning, IoT & Embedded Systems, Drone Aeronautics, 3D Printing & Prototyping.
- **Authoritative Server-Side Pricing:** Pricing strictly dictated by backend database records to prevent client-side price tampering.
- **Interactive Syllabus Accordions:** Module-by-module breakdown with learning outcomes and kit specifications.

### 4.5 Turnkey STEM Lab Services (`services.html`)
- **Turnkey Setup Model:** Complete equipment provisioning, 3D printers, soldering benches, robotic chassis kits, and resident trainer deployment.
- **Faculty Development Programs (FDP):** Structured pedagogy workshops for institutional teachers.
- **Annual Maintenance & Support:** Kit replenishment and technical SLA agreements.

### 4.6 Official Event Gallery & Sliding Carousel (`gallery.html`)
- **Multi-Photo Sliding Feature:** Event cards containing multiple photographs feature an **interactive image carousel** with smooth transition slides, next/previous arrow controls, clickable pagination dots, and swipe support.
- **High-Resolution Lightbox:** Click-to-enlarge view featuring large slide navigation, thumbnail carousel strip, photo counter badge (`📸 Photo X of Y`), and keyboard arrow controls (`←` / `→`).
- **Category & Media Filters:** Toggle between `All Media`, `Photos`, `Videos`, and institutional event categories.
- **Community / Public Upload Modal:** Secure file uploader with drag-and-drop, multi-thumbnail preview grid, individual remove buttons, and automated CSRF validation.

### 4.7 Accredited Certificate Verification (`certificate.html`)
- **Cryptographic Search:** Real-time lookup by Unique Certificate Code (e.g. `RRT-2026-XXXX-XXXX`).
- **Official Visual Certificate Seal:** Digital gold seal, security watermarks, recipient candidate name, course track, award distinction, and issue date.
- **Server-Side PDF Download:** Secure binary streaming of the printable PDF diploma.
- **IDOR Protection:** Guaranteed 404 response for invalid or non-existent certificate IDs.

### 4.8 Contact & Geolocation (`contact.html`)
- **Inquiry Capture Form:** Validated multi-field lead capture dispatched to backend database.
- **Live Office Distance Calculator:** Haversine formula calculation computing the user's distance in kilometers from Robotree's Headquarters / Innovation Lab in Asansol.
- **Interactive Google Maps Embed:** Direct directions to Sentrum Mall Innovation Lab.

### 4.9 Governance & Compliance (`privacy.html` & `terms.html`)
- **Cookie Consent Banner:** Essential vs Optional cookie selection banner.
- **GDPR Subject Access Rights:** Self-service endpoints for Data Export (`GET /api/auth/export-data`) and Account Erasure (`POST /api/auth/delete-account`).
- **Terms of Service:** Academic accreditation warranties, intellectual property, and payment refund policies.

---

## 5. Administrative Management Portal (`admin.html`)

### 5.1 Admin Authentication & Session Security
- **Passcode Protection:** Authenticated via constant-time verification against the server's environment passcode.
- **Automatic Logout on Inactivity / Visibility Change:** Sensitive administrative session instantly terminates if the admin changes tabs or closes the window.
- **Brute-Force Guard:** Failed login tracking with rate-limiting and audit log recording.

### 5.2 Admin Subsystem Controllers
1. **Overview & Analytics Dashboard:** Visual stat counters (Total Users, Registered Students, Inquiries, Active Certificates, Media Assets) and audit trails.
2. **Team Directory Manager:** Add, edit, and delete team member profiles with qualification records and live photo uploads.
3. **Course Track Manager:** Add and edit curriculum tracks, duration, module outlines, and pricing.
4. **Media Gallery Manager:** Batch upload multi-photo event galleries, manage cover photos, delete individual images, or clear entire photo sets.
5. **Leads & Inquiries Manager:** View submitted client inquiries, change status (`New` → `Contacted` → `Closed`), or purge stale records.
6. **Certificate Issuer & Revocation Engine:**
   - Issue accredited certificates with customized candidate name, track, completion date, and distinction.
   - **Revoke Button:** Instant cryptographic revocation that purges the certificate and disables its verification link.
7. **Photo Delete / Remove Controls:** Dedicated delete buttons on all admin form preview drawers for removing attached photos with single-click reset.

---

## 6. Non-Functional & Security Requirements

| Dimension | Specification | Implementation Strategy |
| :--- | :--- | :--- |
| **Response Latency** | < 100ms API response time | In-memory caching + asynchronous non-blocking file I/O. |
| **Asset Optimization** | Gzip compressed bundle < 100kB | Vite tree-shaking, Rollup chunking, and modern WebP image assets. |
| **CSRF Defense** | 100% mutation protection | Double-Submit Cookie Pattern with `robotree_csrf` cookie & `X-CSRF-Token` header. |
| **Timing Attack Defense**| Constant-time comparison | `crypto.timingSafeEqual` for all password and passcode verifications. |
| **Input Sanitization** | Zero XSS / HTML Injection | Plaintext sanitization stripping dangerous tags (`<script>`, `onerror`, `javascript:`). |
| **Database Safety** | Zero Path Traversal | Whitelisted filename regex `^[a-z0-9_-]+\.json$` preventing arbitrary disk reads. |
| **Accessibility** | WCAG 2.1 AA Compliant | Semantic elements, color contrast ratios ≥ 4.5:1, `aria-live` regions, keyboard navigation. |
| **Automated Testing** | 100% Suite Pass Rate | Continuous test suite (`tests/backend.test.js`) with 21 exhaustive integration tests. |

---

## 7. API Specification Reference

### 7.1 Public Endpoints
- `GET /api/health` — System status & timestamp.
- `GET /api/csrf-token` — Generate cryptographic CSRF token & set cookie.
- `GET /api/team` — Retrieve sanitized 17-member team list.
- `GET /api/courses` — Retrieve authoritative course tracks & pricing.
- `GET /api/events` — Retrieve event gallery items with multi-photo arrays.
- `POST /api/contact` — Submit institutional inquiry lead.
- `GET /api/certificates/verify/:code` — Verify certificate authenticity.
- `GET /api/certificates/download/:code` — Stream official PDF diploma.

### 7.2 User Authentication Endpoints
- `POST /api/auth/register` — Create student / candidate account.
- `POST /api/auth/login` — Authenticate user and issue session token.
- `POST /api/auth/reset-password` — Verify email and update password hash.
- `GET /api/auth/export-data` — GDPR compliant personal data export.
- `POST /api/auth/delete-account` — GDPR compliant account erasure.

### 7.3 Administrative Endpoints (`requireAdmin`)
- `POST /api/admin/login` — Authenticate admin passcode.
- `GET /api/admin/dashboard` — Fetch full system telemetry and management datasets.
- `POST /api/admin/team` | `PUT /api/admin/team/:id` | `DELETE /api/admin/team/:id` — Team CRUD.
- `POST /api/admin/courses` | `PUT /api/admin/courses/:id` | `DELETE /api/admin/courses/:id` — Course tracks CRUD.
- `POST /api/admin/events` | `PUT /api/admin/events/:id` | `DELETE /api/admin/events/:id` — Event multi-photo media CRUD.
- `POST /api/admin/certificates/issue` — Issue new accredited certificate.
- `DELETE /api/admin/certificates/:id` — Revoke and permanently delete certificate.

---

## 8. Release Verification & Sign-Off

- **Automated Test Results:** 21 passed / 0 failed (`tests/backend.test.js`).
- **Production Build:** Successfully compiled with Vite v5 into `dist/`.
- **Sign-off Date:** August 31, 2026.
- **Status:** **Approved for Live Deployment.**
