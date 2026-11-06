# Production Runbook

## Release

```bash
npm ci
npm run test
npm run build
npm run verify:production
npm audit --omit=dev --audit-level=moderate
```

Deploy only when all commands pass.

## Start

```bash
cp backend/config/production.env.example backend/config/production.env
# Edit backend/config/production.env with real secrets and origins.
node backend/src/start.js
```

For Linux service hosting:

```bash
sudo cp backend/deploy/robotree.service /etc/systemd/system/robotree.service
sudo systemctl daemon-reload
sudo systemctl enable --now robotree
sudo systemctl status robotree
```

## Reverse Proxy

Use `backend/deploy/nginx.robotree.conf` as the base Nginx config. Replace `robotree.org`, certificate paths, and filesystem paths for the real deployment.

Required checks after enabling Nginx:

```bash
curl -I https://robotree.org/api/health
curl -I https://robotree.org/assets/robotree_logo.png
```

Confirm:

- `strict-transport-security` exists.
- `/api/health` returns `200`.
- `/assets/*` returns long-lived `cache-control`.
- HTTP redirects to HTTPS.

## Backups

Manual backup:

```bash
npm run backup
```

Restore latest backup:

```bash
npm run restore
```

Recommended cron:

```cron
0 2 * * * cd /var/www/robotree && /usr/bin/npm run backup >> /var/log/robotree-backup.log 2>&1
```

## Monitoring

Probe:

- `GET /api/health` every 30 seconds for uptime.
- `GET /api/health/diagnostics` every 5 minutes for memory and data metrics.

Alerts:

- 5xx rate above 1% for 5 minutes.
- health check failure for 2 consecutive probes.
- disk free space below 20%.
- certificate expiry below 14 days.
- backup older than 24 hours.

## Rollback

```bash
sudo systemctl stop robotree
git checkout <previous-release-tag>
npm ci
npm run build
npm run test
sudo systemctl start robotree
```

If data corruption is confirmed, restore the latest clean snapshot after stopping the service.

## Post-Launch Maintenance

- Daily: review uptime, error logs, backup success, disk capacity.
- Weekly: run `npm audit --omit=dev`, review admin activity logs, test lead forms.
- Monthly: run Lighthouse, accessibility smoke tests, dependency updates, restore drill.
- Quarterly: rotate secrets, review privacy processors, run DAST scan, test disaster recovery.
