# AI Agents & Autonomous Coding Directives (AGENTS)

**Product Name:** Robotree Robotics Corporate & STEM Education Web Platform  
**Document Version:** 2.1.0  
**Target Audience:** Autonomous AI Assistants, Pair Programmers & Automated Coders  
**Entity:** Robotree Robotics LLP (GeM & MSME Accredited Entity)  

---

## 01. Purpose & Authority

This document defines the strict operating boundaries, architectural requirements, and verification protocols for any Artificial Intelligence (AI) assistant, autonomous agent, or automated coding tool modifying or maintaining the Robotree codebase.

> **CRITICAL RULE:** Any AI agent interacting with this codebase must read and abide by these rules before proposing or applying code modifications.

---

## 02. Architectural Directives

### 2.1 The "MVC + Services" Invariant
The backend is structured according to the enterprise **MVC + Services** pattern. Every request flow must obey the following unidirectional pipeline:

```
Route -> Middleware -> Controller -> Service -> Repository -> Data Store
```

- **Controllers MUST be thin:** Controllers are strictly responsible for parsing HTTP request parameters, calling the appropriate Service method, and returning the HTTP status code and JSON response.
- **NEVER put business logic in Controllers:** All business validation, telemetry logging, deduplication, and calculations belong in `backend/src/services/`.
- **NEVER access the database or filesystem in Controllers:** Controllers must never import persistence modules or call raw disk functions directly.
- **Repositories MUST be abstracted:** Database interactions must go through interfaces defined in `backend/src/repositories/interfaces/`.

### 2.2 TypeScript & Build Rigor
- **Pure TypeScript in `backend/src/`:** Do not create raw `.js` files in `backend/src/`. All backend code must be strongly typed TypeScript compiled via `npm run backend:build`.
- **Zero Type Evasions:** Avoid `any` types. Utilize domain models defined in `backend/src/models/index.ts`.
- **No Monolithic Revival:** Never recreate monolithic files like the deleted `app.js` or `schemas.js`. Keep files modular and focused on a single responsibility.

---

## 03. Security & Compliance Mandates

### 3.1 Authentication & Passcodes
- **Admin Passcode:** The primary admin passcode is `Anni4515` (stored in `data/settings.json` or `.env`). Never change or overwrite this passcode without explicit user authorization.
- **Timing-Safe Evaluation:** Always use `crypto.timingSafeEqual` (via `backend/src/security/timingSafe.ts`) when comparing credentials to prevent timing side-channel exploits.
- **Password Storage:** Always use Argon2id for password hashing. Never store or accept plaintext passwords.

### 3.2 CSRF & Mutation Defense
- All mutating endpoints (`POST`, `PUT`, `DELETE`, `PATCH`) must be protected by the `verifyCsrfToken` middleware.
- Never disable or bypass CSRF checking for testing shortcuts.

### 3.3 Government of India Protocol Compliance
- Do not re-introduce proprietary copyright notices (e.g. `© 2026 Robotree Robotics LLP. All rights reserved.`).
- Preserve the official Government Protocol compliance statement:
  > *"Robotree Robotics LLP • Operating in accordance with Government of India Protocols (GeM & MSME Accredited Entity)"*

---

## 04. Verification Before Completion (Iron Law)

Autonomous agents must adhere to the principle: **Evidence before assertions, always.**

Before claiming that any task, bugfix, or refactoring is complete:
1. **Compile Backend:** Execute `npm run backend:build` and confirm exit code 0.
2. **Run Test Suite:** Execute `npm test` and verify that all 22 test suites pass with 0 failures.
3. **Run Production Smoke Verification:** Execute `node scripts/verify-production.js` and verify all 4 checks pass.
4. **Never Guess Status:** If a command fails or has not been run, state the actual status with output evidence rather than assuming it works.

---

## 05. Summary Checklist for AI Agents

- [ ] Is the new code modular and placed in the correct layer (`routes/`, `controllers/`, `services/`, `repositories/`, `models/`)?
- [ ] Are controllers kept thin with zero raw database/file calls?
- [ ] Does `npm run backend:build` pass with zero TypeScript errors?
- [ ] Does `npm test` pass all 22 tests?
- [ ] Are security headers, CSRF, and input validation preserved?
- [ ] Are all references to the Government of India protocol intact?
