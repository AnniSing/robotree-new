# Robotree Platform - Maintenance & Administration Guide

## 1. Role-Based Access Control (RBAC)
* **Master Administrator**: Access to the Admin Portal (`/admin.html`), Event Gallery management, Certificate generation, User directory oversight, and security alerts.
* **Trainer / Employee Accounts**: Internal role for instructors and resident trainers.
* **Student Accounts**: Public user registration for course progress, certificate downloads, and workshop materials.

---

## 2. Admin Portal Operations (`/admin.html`)
1. **Login**: Navigate to `/admin.html` and input your authorized admin passcode (`ADMIN_PASSCODE` set in environment).
2. **Event Photo Gallery Upload**:
   - Scroll down to **Event Photo Gallery Manager**.
   - Click **+ Upload Event Photo**.
   - Fill in Event Title, Category, Institution Name, Date, Attendees metric, and drop an image file (or paste an image URL).
   - Click **Save & Publish Photo**. It reflects immediately across the homepage and event tracks!
3. **Reviewing Leads & Inquiries**:
   - Review incoming institutional lab setup requests and course enrollments directly from the **Recent Inquiries & Leads** panel.
4. **Monitoring Security Alerts**:
   - Inspect the **Security Alerts** panel for failed login attempts or unauthorized passcode attempts with recorded client IPs.

---

## 3. GDPR & CCPA Compliance Workflow
* **Exporting User Data**: If a user requests a copy of their personal data, they can click **"Export My Data"** from their account drawer, or the administrator can fetch records from `/api/auth/export-data`.
* **Deleting User Data**: If a user requests account deletion under the Right to Erasure, they can submit their password confirmation to `/api/auth/delete-account`, which permanently purges their record from `data/users.json`.

---

## 4. Troubleshooting & Routine Maintenance

| Issue | Root Cause | Solution |
|---|---|---|
| Admin Login returns 401 | Incorrect passcode or IP rate-limited | Verify `ADMIN_PASSCODE` in environment and wait 1 minute for rate limit window to clear. |
| Certificate verification returns 404 | Non-existent or invalid reference ID format | Check reference ID follows `RRT-XXXX-XXXX-XXXX` format in `data/certificates.json`. |
| Memory usage spike | Unpruned memory cache | The built-in memory pruner runs every 5 minutes; check `/api/health/diagnostics`. |
| Disk space alerts | Accumulation of database backups | `scripts/backup.js` automatically retains the 30 most recent snapshots. |
