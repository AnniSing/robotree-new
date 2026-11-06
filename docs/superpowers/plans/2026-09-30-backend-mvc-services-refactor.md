# Senior Backend MVC + Services Architecture Refactor & Codebase Hygiene Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the backend architecture strictly into the industry-standard "MVC + Services" pattern (Route -> Controller -> Service -> Repository -> Database) as specified in the provided architecture guide, and purge all legacy duplicate and dead code from the repository.

**Architecture:** Implement a strict separation of concerns where Controllers handle only HTTP orchestration (request parsing, response codes, and serialization), Services encapsulate domain business rules and validation logic, Repositories provide abstracted data access, and Database handles persistence. Establish the canonical `models/` directory for domain entities, and eliminate 97+ KB of obsolete legacy monolith files (`app.js`, `validation/schemas.js`, `start.js`, root `schemas.js`).

**Tech Stack:** Node.js (ESM), TypeScript, Express, Zod, Argon2, node:test.

## Global Constraints
- Must maintain 100% backward compatibility with all 22 passing tests in `npm test` and `scripts/verify-production.js`.
- Must preserve active admin credentials (`Anni4515` primary passcode in `data/settings.json`, fallback in `.env`).
- Must adhere strictly to TypeScript strict mode with 0 compile errors.
- Every endpoint request flow must follow: `Route -> Controller -> Service -> Repository -> Database`.

---

### Task 1: Establish Canonical `models/` Domain Layer
**Files:**
- Create: `backend/src/models/index.ts`
- Modify: `backend/src/types/index.ts`

- [x] **Step 1: Create `backend/src/models/index.ts`**
Define clean domain entity models (User, Certificate, Course, Event, Inquiry, SiteSettings, AuditLog) with strict TypeScript types and export them.
- [x] **Step 2: Re-export from `backend/src/types/index.ts`**
Ensure existing consumers importing from `../types/index.js` continue working transparently without breakage.
- [x] **Step 3: Verify TypeScript compilation**
Run `npm run backend:build` to confirm 0 compilation errors.

---

### Task 2: Implement `InquiryService` (Decouple `InquiryController`)
**Files:**
- Create: `backend/src/services/InquiryService.ts`
- Modify: `backend/src/controllers/InquiryController.ts`

- [x] **Step 1: Write `InquiryService.ts`**
Encapsulate contact submissions, newsletter subscriptions (with deduplication), program interest tracking, feedback submissions, analytics recording, and inquiry status management.
- [x] **Step 2: Refactor `InquiryController.ts`**
Remove all direct `db.get*()` and `db.save*()` calls. Delegate 100% of business operations to `InquiryService`.
- [x] **Step 3: Run backend test suite**
Run `npm test` and confirm all inquiry and newsletter tests pass.

---

### Task 3: Implement `AdminService` (Decouple `AdminController`)
**Files:**
- Create: `backend/src/services/AdminService.ts`
- Modify: `backend/src/controllers/AdminController.ts`

- [x] **Step 1: Write `AdminService.ts`**
Encapsulate dashboard telemetry compilation, activity log retrieval, site content settings (hero metric and Government Protocol notice), and user role/account administration.
- [x] **Step 2: Refactor `AdminController.ts`**
Remove raw database access and direct array slicing from `AdminController.ts`. Make `AdminController` thin and purely HTTP-focused.
- [x] **Step 3: Run backend test suite**
Run `npm test` and confirm all admin dashboard, login, and user management tests pass.

---

### Task 4: Purge Dead Legacy Monolith Files & Useless Lines
**Files:**
- Delete: `backend/src/app.js` (80,105 bytes of dead monolithic code)
- Delete: `backend/src/validation/schemas.js` (17,149 bytes of obsolete code)
- Delete: `backend/src/start.js` (56 bytes of dead code)
- Delete: `schemas.js` (obsolete root pointer)
- Modify: `tsconfig.json` (remove `"allowJs": true` to enforce pure TypeScript across `backend/src`)

- [x] **Step 1: Delete obsolete legacy files**
Safely remove the 4 dead files.
- [x] **Step 2: Update `tsconfig.json`**
Set `"allowJs": false` so only strictly-typed TypeScript files in `backend/src` are compiled.
- [x] **Step 3: Compile and Test**
Run `npm run backend:build` and `npm test` to ensure zero regressions.

---

### Task 5: Full Architectural & Production Verification
- [x] **Step 1: Run complete test suite**
Execute `npm test` (verify 22/22 pass).
- [x] **Step 2: Run production smoke verification**
Execute `node scripts/verify-production.js` (verify all 4 checks pass).
- [x] **Step 3: Run 11-page HTML integrity audit**
Execute `scratch/audit-all-pages.js`.
- [x] **Step 4: Run API route audit**
Execute `scratch/audit-api-routes.js`.
- [x] **Step 5: Verify live servers on port 5000 and port 3000**
Confirm live operational status.
