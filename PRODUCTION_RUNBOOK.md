# Production Operations & Deployment Runbook

Target platform: Robotree Robotics website and backend  
Runtime: Node.js 20+  
Backend entrypoint: `backend/src/start.js`  
Compatibility entrypoint: `server.js`

## Local Release Gate

```bash
npm ci
npm run test
npm run build
npm run verify:production
npm audit --omit=dev --audit-level=moderate
```

## Environment

Start from:

```bash
backend/config/production.env.example
```

Required production values:

- `NODE_ENV=production`
- `PORT=5000`
- `ADMIN_PASSCODE`
- `SESSION_SECRET`
- `ALLOWED_ORIGINS`
- `ROBOTREE_DATA_DIR`
- `STATIC_ASSET_CDN_ORIGIN`
- `CDN_CACHE_SECONDS`

## Start

```bash
node backend/src/start.js
```

`node server.js` remains supported for older hosting setups.

## TLS, CDN, And Process Manager

- Use `backend/deploy/nginx.robotree.conf` for TLS 1.3, HSTS, HTTPS redirect, static asset caching, and reverse proxy headers.
- Use `backend/deploy/robotree.service` for systemd-managed production hosting.
- Configure CDN/WAF in the hosting provider for `/assets/*`, DDoS protection, and uptime checks.

## Backups

```bash
npm run backup
npm run restore
```

Schedule `npm run backup` nightly and test restore monthly.

## Monitoring

- Uptime: `GET /api/health`
- Diagnostics: `GET /api/health/diagnostics`
- Logs: systemd journal, Nginx access/error logs, CDN/WAF logs
- Alerts: health failures, 5xx spikes, certificate expiry, backup age, disk usage

## Rollback

1. Stop the service.
2. Restore the last known good release.
3. Run `npm ci`, `npm run build`, and `npm run test`.
4. Restart the service.
5. Restore data from the latest clean snapshot only if data corruption is confirmed.
