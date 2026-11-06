# Security And Compliance

## Implemented In Code

- Removes `X-Powered-By`.
- Adds `X-Content-Type-Options: nosniff`.
- Adds `X-Frame-Options: DENY`.
- Adds `Referrer-Policy: strict-origin-when-cross-origin`.
- Adds `Permissions-Policy` for camera, microphone, geolocation, and payment.
- Adds `Cross-Origin-Opener-Policy: same-origin`.
- Adds `Cross-Origin-Resource-Policy: same-origin`.
- Adds a restrictive Content Security Policy.
- Adds HSTS in `NODE_ENV=production`.
- Enforces same-origin/trusted-origin checks on mutating API calls.
- Emits CORS headers only for configured trusted origins.
- Requires CSRF token + cookie for mutating API calls.
- Enforces body size limits on JSON/form payloads.
- Validates and sanitizes all defined request bodies, query params, and route params.
- Uses rate limits on general API, auth, admin login, forms, and certificate generation.
- Hashes passwords with PBKDF2-SHA256 at 210,000 iterations.
- Uses constant-time comparisons for credentials and token checks.
- Stores public user responses without password hashes.
- Supports data export and account deletion workflows.
- Protects JSON data access from path traversal and prototype pollution.
- Logs structured request records with request IDs.

## Production Deployment Requirements

These controls must be configured outside Node.js:

- Terminate HTTPS with TLS 1.3 at Nginx, Cloudflare, AWS ALB, Azure Front Door, or equivalent.
- Enable certificate auto-renewal and alert before certificate expiry.
- Configure CDN/WAF rules for `/assets/*`, static HTML, and API DDoS protection.
- Store `ADMIN_PASSCODE`, `SESSION_SECRET`, and any payment/CRM credentials in a secret manager.
- Mount `ROBOTREE_DATA_DIR` on durable encrypted storage or migrate to a managed database.
- Run `npm audit --omit=dev --audit-level=moderate` in CI and before release.
- Run OWASP ZAP, Burp Suite, or equivalent DAST before public launch.
- Run Lighthouse and accessibility testing against the deployed URL after CDN/TLS are active.

## GDPR/CCPA Checklist

- Provide Privacy Policy, Terms, and Cookie Policy pages in the frontend.
- Keep consent logs for analytics/marketing cookies when enabled.
- Honor user data export via `/api/auth/export-data`.
- Honor deletion requests via `/api/auth/delete-account`.
- Maintain a data retention schedule for leads, applications, feedback, and analytics.
- Document processors for payments, analytics, CRM, email, hosting, CDN, and backups.
- Add a support contact for privacy requests.

## Incident Response

1. Confirm incident scope from logs, monitoring, hosting, and CDN/WAF dashboards.
2. Rotate `ADMIN_PASSCODE`, `SESSION_SECRET`, and provider keys if credentials may be exposed.
3. Disable affected routes at the proxy if active exploitation is observed.
4. Preserve logs and current data snapshots before restoration.
5. Restore from `backups/snapshot_*` only after validating integrity.
6. Publish customer/regulatory notices when legally required.
