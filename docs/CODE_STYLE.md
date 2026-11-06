# Code Style, Conventions & Engineering Standards (CODE_STYLE)

**Product Name:** Robotree Robotics Corporate & STEM Education Web Platform  
**Document Version:** 2.1.0  
**Status:** Canonical Engineering Standard  
**Entity:** Robotree Robotics LLP (GeM & MSME Accredited Entity)  
**Author:** Staff Software Engineer & Technical Lead  

---

## 01. Core Engineering Principles

1. **Clarity Over Cleverness:** Write code that is immediately readable, self-documenting, and maintainable by any senior or junior engineer.
2. **Strict Layering Discipline:** Respect the unidirectional data flow (`Route -> Middleware -> Controller -> Service -> Repository -> Database`). Never take shortcuts by querying repositories directly from controllers.
3. **Deterministic Type Safety:** Avoid type escapes (`any`, `unknown as any`). Write explicit TypeScript interfaces and domain models.
4. **Single Responsibility Principle (SRP):** Each file, class, and function must have one clear reason to change. Monolithic multi-thousand-line files are strictly forbidden.

---

## 02. TypeScript & JavaScript Standards

### 2.1 Naming Conventions
- **Files & Modules:**
  - Controllers: PascalCase with suffix (e.g. `AdminController.ts`, `InquiryController.ts`).
  - Services: PascalCase with suffix (e.g. `AdminService.ts`, `InquiryService.ts`).
  - Repositories: PascalCase with prefix/suffix (e.g. `JsonRepositories.ts`, `IUserRepository.ts`).
  - Middleware & Utilities: camelCase (e.g. `csrf.ts`, `authenticate.ts`, `timingSafe.ts`).
  - Route definitions: kebab-case with `.routes.ts` (e.g. `admin.routes.ts`, `inquiry.routes.ts`).
- **Identifiers:**
  - Classes, Interfaces, Types: `PascalCase` (e.g. `SiteSettings`, `Inquiry`, `AppError`).
  - Methods, Functions, Variables: `camelCase` (e.g. `updateSiteSettings`, `handleContactSubmission`).
  - Environment & Constant Values: `UPPER_SNAKE_CASE` (e.g. `DEFAULT_PORT`, `MAX_LOGIN_ATTEMPTS`).
  - Interface prefixing: Prefix repository interfaces with `I` (e.g. `IUserRepository`, `IInquiryRepository`).

### 2.2 Async / Await & Error Handling
- Always use `async` / `await` instead of raw Promise `.then()` / `.catch()` chains.
- In Express controllers, always wrap async execution in `try / catch` blocks and forward unhandled rejections to `next(err)`.
- Use the typed `AppError` class instead of generic JavaScript `Error`:

```typescript
// Good:
if (!user) {
  throw AppError.notFound('Requested user profile does not exist');
}

// Bad:
if (!user) {
  throw new Error('User not found');
}
```

---

## 03. HTML5 & CSS3 Standards

### 3.1 Semantic HTML Markup
- Avoid `<div>` soup. Use semantic landmark tags: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
- Every image must have an explicit `alt` description and `loading="lazy"` attribute (unless it is an above-the-fold hero image).
- Buttons that perform actions must be `<button type="button">` or `<button type="submit">`. Never use `<div onclick="...">`.

### 3.2 CSS Conventions & Token Usage
- Always utilize Design System CSS Custom Properties (`var(--bg)`, `var(--green)`, `var(--text)`, etc.) instead of hardcoded hex values.
- Adhere to the defined corner radii (`--radius-sm`, `--radius-md`, `--radius-lg`) and typography scale (`--fs-sm`, `--fs-base`, etc.).
- Ensure all interactive elements declare clear `:focus-visible` styles for keyboard navigation accessibility.

---

## 04. Git & Commit Message Conventions

We adhere to the **Conventional Commits** specification:

```
<type>(<scope>): <short description in imperative present tense>

[optional detailed body]
[optional issue reference]
```

### Supported Commit Types:
| Type | Purpose | Example |
|:---|:---|:---|
| `feat` | Adding a new user-facing or technical capability | `feat(admin): add live hero metric editing panel` |
| `fix` | Resolving a bug or defect | `fix(csrf): preserve cookie token across cross-origin requests` |
| `refactor` | Code restructuring without behavior changes | `refactor(backend): decouple InquiryController into InquiryService` |
| `perf` | Optimizations improving execution speed or memory | `perf(static): enable brotli compression for bundle assets` |
| `test` | Adding or updating automated test suites | `test(auth): add Argon2id brute-force rate limit tests` |
| `docs` | Documentation additions or updates | `docs(architecture): document MVC + Services data flow` |
| `chore` | Maintenance tasks, dependency updates, configs | `chore(deps): update TypeScript to 5.8.2` |

---

## 05. Pull Request & Code Review Checklist

Before submitting code for review, every engineer must verify:

1. **Compilation Check:** `npm run backend:build` completes with zero errors.
2. **Test Suite Check:** `npm test` passes all 22 test suites.
3. **Production Verification:** `node scripts/verify-production.js` succeeds with 4/4 checks.
4. **Code Cleanliness:** No `console.log` statements left behind in production code (use structured `logger`).
5. **No Dead Files:** Never leave unused scratch scripts, backup files (e.g. `app.old.js`), or obsolete prototypes in the repository.
6. **Regulatory Check:** Ensure no commercial copyright lines are reintroduced; confirm presence of Government of India protocol text.
