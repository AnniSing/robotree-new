# Robotree Platform - Operations & Staff Training Manual

## 1. Welcome to the Robotree Operational Platform
This training manual is designed for the Robotree administrative, IT, and customer operations teams. It outlines day-to-day workflows, student inquiry handling, event gallery photo publishing, certificate generation and verification, security procedures, and system monitoring.

---

## 2. Admin Portal & Event Gallery Management

### 2.1. Accessing the Admin Portal
* **URL**: `http://localhost:5000/admin.html` (or `https://robotree.org/admin.html` in production).
* **Authentication**: Enter your master security passcode (configured via `ADMIN_PASSCODE` environment variable).
* **Security Note**: All admin actions are protected by timed session tokens and CSRF guards. Sessions expire after 2 hours of inactivity.

### 2.2. Uploading & Publishing Event Photographs
1. Scroll down to the **Event Photo Gallery Manager** section.
2. Click **+ Upload Event Photo**.
3. Complete the form:
   - **Event Title**: e.g., *"NIT Arunachal Pradesh 7-Day Robotics Workshop"*.
   - **Category**: Select from dropdown (*College Bootcamps*, *Hackathons & Fests*, *University Labs*, *Keynotes & Summits*, *School Robotics*).
   - **Institution Name**: e.g., *"NIT Arunachal Pradesh"*.
   - **Event Date**: Date of the event.
   - **Attendees Metric**: e.g., *"500+ Engineers"*.
   - **Event Image**: Either drag and drop an image file (PNG, JPG, WebP) into the upload dropzone or paste an image URL.
   - **Description**: Summary of technologies, kits, and student outcomes.
4. Click **Save & Publish Photo**.
5. The new event card will immediately go live on the public website homepage (`index.html#events`) and can be filtered by category or clicked for high-resolution zoom lightbox viewing.

### 2.3. Editing or Deleting an Event Photo
* **Edit**: Click the **Edit** button on any event card to update its title, description, or replacement image.
* **Delete**: Click **Delete** and confirm the prompt. The event is permanently removed and an audit log entry is recorded.

---

## 3. Student Inquiries & Lead Management
* When a visitor submits a contact form from `index.html` or `contact.html`, a new lead record is stored in `data/inquiries.json`.
* Administrators can review incoming leads under the **Recent Inquiries & Leads** panel in the Admin Portal.
* Leads include student name, email, phone number, institution, interest track, and message.

---

## 4. Student Workshop Certificates & Verification

### 4.1. Student Certificate Verification
* Students and institutions can verify certificate authenticity by entering their unique reference code (e.g., `RRT-2026-XXXX-XXXX`) at `/certificate.html`.
* The platform queries the cryptographically signed database in `data/certificates.json` and renders the verified student name, course, issue date, and official accreditation badges.

### 4.2. Vector PDF Generation & Download
* Clicking **Download Official PDF** invokes the backend `pdf-lib` vector rendering engine (`/api/certificates/download/:code`) to generate a high-resolution print-ready certificate.

---

## 5. GDPR & Data Privacy Requests
* **User Data Export**: If a student requests their personal data, they can click **"Export My Data"** from their logged-in account drawer, which downloads a machine-readable JSON file.
* **Account Erasure**: If a student requests deletion under the Right to Erasure, they can submit their password confirmation to permanently delete their account record.

---

## 6. Daily Routine & System Health Check
1. **Health Telemetry**: Visit `GET /api/health/diagnostics` once daily to ensure RSS memory is within normal bounds (< 150 MB) and database records are healthy.
2. **Backups**: Automated nightly backups run via cron. For manual backups before major updates, run:
   ```bash
   npm run backup
   ```
3. **Restoring from Backup**: In the event of data corruption or accidental deletion, run:
   ```bash
   npm run restore
   ```
