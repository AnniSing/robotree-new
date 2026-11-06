# Product Requirement Document (PRD): Robotree Robotics Web Platform

**Product Name:** Robotree Robotics Corporate & STEM Education Web Platform  
**Document Version:** 2.0.0  
**Status:** Approved & Implemented  
**Target Audience:** School Students (Grades 1-12), University/Engineering Candidates, Corporate Enterprise Clients, Educational Institutions (JNV, KVS, NITs, DPS, DAV).

---

## 1. Executive Summary & Product Vision

**Robotree Robotics LLP** is an ISO 9001:2015, GeM, and MSME accredited enterprise specializing in robotics training, Artificial Intelligence, Drone technology, 3D printing, AR/VR experiences, and turnkey lab setups.

The primary objective of this web platform is to deliver an enterprise-grade, ultra-performant, secure, accessible, and responsive user experience. It serves as the digital front-door for course enrollments, institutional partnership inquiries, certificate verification, lead acquisition, and online course payments via Razorpay.

---

## 2. User Personas & Key Stakeholders

| Persona | Primary Goals | Key Platform Interaction |
| :--- | :--- | :--- |
| **School Learner / Parent** | Discover hands-on robotics workshops, RJIL modules, and fee details. | Explore 9 specialized courses, enroll via Razorpay or submit inquiry. |
| **College / University Student** | Find internships, certifications, and advanced AI/IoT/Drone modules. | View course prospectuses, verify certificates, apply for programs. |
| **School Administrator / Principal** | Request end-to-end turnkey STEM/Robotics/AI lab setups. | View institutional partner credentials (NIT, JNV, KVS) and submit consultation inquiries. |
| **Job Applicant / Candidate** | Explore career opportunities and team leadership credentials. | View team members grid, open positions, and submit applications. |
| **Platform Administrator** | Manage leads, verify certificates, audit login attempts. | Secure Admin Dashboard (`/api/admin/dashboard`) with token authentication. |

---

## 3. Functional Requirements

### 3.1 Course Prospectus & Online Enrollment
- Display 9 specialized training courses across Robotics, AI, IoT, Drones, 3D Printing, Cyber Security, Space Tech, and Web Development.
- Instant Razorpay payment gateway checkout integration for online enrollment.
- Free inquiry modal fallback for custom corporate/institutional counseling.

### 3.2 Certificate Verification Portal
- Verifiable online certificate accreditation system.
- Supports instant lookup by Reference ID (e.g. `RRT-2026-XXXX-KL2M`).
- Displays student name, course title, issue date, and GeM/MSME ISO accreditation badge.

### 3.3 Institutional Partner & Social Proof Display
- Visual partner banner highlighting accredited institutional partners (NIT Arunachal Pradesh, NIT Jamshedpur, JNV Various Schools, KVS, DPS, DAV).

### 3.4 Team & Leadership Directory
- Dynamic API endpoint (`/api/team`) serving all 19 official team members with qualifications, roles, and experience.

### 3.5 Compliance & Legal Protection
- Mandatory GDPR/CCPA Cookie Consent Banner with granular accept/decline actions.
- Interactive modal dialogues for Privacy Policy and Terms of Service.

---

## 4. Non-Functional & Technical Requirements

### 4.1 Performance Targets
- **Lighthouse Performance Score:** $\ge 90+$ across Performance, Accessibility, Best Practices, and SEO.
- **Page Load Time:** Under 2 seconds on 3G mobile networks.
- **Resource Optimization:** Lazy loading for images (`loading="lazy"`), WebP format compression, static asset caching.

### 4.2 Security & Compliance
- **Transport Encryption:** HTTPS with TLS 1.3 and HSTS (`max-age=63072000`).
- **HTTP Security Headers:** Strict Content-Security-Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- **Input Validation & Sanitization:** Protection against SQL Injection, Cross-Site Scripting (XSS), and CSRF (`X-CSRF-Token` headers).
- **Rate Limiting:** IP-based request rate limiting on sensitive API routes.

### 4.3 Accessibility & Compatibility
- **WCAG 2.1 AA Compliance:** Full keyboard navigation support, high contrast ratios, visible focus indicators, screen reader ARIA attributes.
- **Cross-Browser Compatibility:** Tested on Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge.

---

## 5. Automated CI/CD & Verification

- **CI/CD Pipeline:** GitHub Actions workflow (`.github/workflows/ci.yml`) automating linting, testing, security auditing, and production builds.
- **Unit & Integration Test Suite:** Automated test runner (`npm run test`) validating endpoints, security headers, CSRF defense, and authentication.
