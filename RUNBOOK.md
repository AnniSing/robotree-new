# Robotree Enterprise Production Platform - Operations Runbook

## 1. System Overview & Architecture
* **Application Server**: Node.js hardened Express API server with PBKDF2 210k password hashing, HTTP Security Headers, and CSP.
* **Frontend Engine**: Vite build system outputting static assets to `/dist` with zero-dependency vanilla JS and responsive CSS tokens.
* **Data Persistence**: JSON Document Database engine (`data/*.json`) protected against prototype pollution and directory path traversal.
* **Default Port**: `5000` (configurable via `PORT` environment variable).

---

## 2. Environment Variables & Secrets
| Variable | Description | Production Default / Recommendation |
|---|---|---|
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Listening network port | `5000` |
| `ADMIN_PASSCODE` | Master administrative passcode | Secure alphanumeric (min 12 chars) |
| `SESSION_SECRET` | Secret key for HMAC token signing | 64-char cryptographically random hex |
| `ALLOWED_ORIGINS` | Permitted CORS origins | `https://robotree.org,https://www.robotree.org` |
| `ROBOTREE_DATA_DIR` | Custom path to database storage | `/var/data/robotree` (or project `/data`) |

---

## 3. Production Deployment & Start Procedure

### Standard Node.js Server:
```bash
# 1. Install production dependencies
npm ci --omit=dev

# 2. Compile static assets
npm run build

# 3. Start hardened backend
NODE_ENV=production node server.js
```

### Systemd Service Daemon (`/etc/systemd/system/robotree.service`):
```ini
[Unit]
Description=Robotree Robotics Production Web Platform
After=network.target

[Service]
Type=simple
User=robotree
WorkingDirectory=/var/www/robotree
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=robotree
Environment=NODE_ENV=production PORT=5000

[Install]
WantedBy=multi-user.target
```

---

## 4. Nginx Reverse Proxy with TLS 1.3 & HSTS Configuration

```nginx
server {
    listen 80;
    server_name robotree.org www.robotree.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name robotree.org www.robotree.org;

    ssl_certificate /etc/letsencrypt/live/robotree.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/robotree.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS Preload
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Static Asset Caching
    location /assets/ {
        alias /var/www/robotree/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Automated Backups & Disaster Recovery

### Manual Backup:
```bash
npm run backup
# Output: backups/snapshot_YYYY-MM-DDTHH-mm-ss-sssZ/
```

### Automated Nightly Cron Job (Linux):
```cron
0 2 * * * cd /var/www/robotree && /usr/bin/npm run backup >> /var/log/robotree-backup.log 2>&1
```

### Disaster Recovery Restore:
```bash
# Restore latest snapshot:
npm run restore

# Restore a specific timestamped snapshot:
node scripts/restore.js snapshot_2026-08-26T15-08-02-572Z
```

---

## 6. Health Checks, Monitoring & Diagnostics

* **Basic Health Probe**: `GET /api/health` → `200 OK`
* **System Diagnostics & Memory**: `GET /api/health/diagnostics` → Returns RSS memory, heap usage, uptime, and database metrics.
* **Audit Activity Logs**: `GET /api/activity-logs` *(Protected by Admin Token)*.
