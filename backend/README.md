# Robotree Backend

Production backend for the Robotree website. The root `server.js` remains a compatibility entrypoint, while the backend source of truth now lives under `backend/src`.

## Structure

```text
backend/
  config/production.env.example
  deploy/nginx.robotree.conf
  deploy/robotree.service
  docs/
  src/
    app.js
    start.js
    persistence/json-database.js
    validation/schemas.js
```

## Runtime

```bash
npm ci
npm run build
npm run backend
```

The backend listens on `PORT` or `5000` by default and serves:

- API endpoints under `/api/*`
- static frontend files from `dist/` in production
- root HTML/static assets from the project root in development

## Production Controls

- Security headers: CSP, HSTS in production, X-Frame-Options, nosniff, referrer policy, permissions policy
- Request protection: CSRF double-submit token, trusted-origin CORS, rate limiting, JSON body limits
- Auth: PBKDF2-SHA256 password hashing, HMAC user tokens, short-lived admin sessions
- Data: path-traversal protected JSON persistence with atomic writes
- Operations: `/api/health`, `/api/health/diagnostics`, structured request logging, backup/restore scripts
- CDN readiness: immutable browser/CDN cache headers for `/assets/*`

## Verification

```bash
npm run test
npm run build
npm run verify:production
```

`verify:production` starts the backend in production mode on an ephemeral local port and checks health, security headers, static cache headers, CSRF rejection, and validation behavior.
